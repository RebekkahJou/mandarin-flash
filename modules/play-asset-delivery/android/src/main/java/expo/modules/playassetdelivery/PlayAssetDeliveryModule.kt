package expo.modules.playassetdelivery

import android.app.Activity
import com.google.android.gms.tasks.Task
import com.google.android.play.core.assetpacks.AssetPackException
import com.google.android.play.core.assetpacks.AssetPackManager
import com.google.android.play.core.assetpacks.AssetPackManagerFactory
import com.google.android.play.core.assetpacks.AssetPackState
import com.google.android.play.core.assetpacks.AssetPackStateUpdateListener
import com.google.android.play.core.assetpacks.AssetPackStates
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Wraps Play Asset Delivery for on-demand language packs (route A). The Play Store app does the
// download; this module only asks for packs, reports their state and says where a finished pack
// was unpacked.

private const val STATE_CHANGED_EVENT = "onPackStateChanged"

private const val REJECTION_CODE = "ERR_ASSET_PACK"

private fun stateRecord(state: AssetPackState): Map<String, Any> =
  mapOf(
    "name" to state.name(),
    "status" to state.status(),
    "errorCode" to state.errorCode(),
    "bytesDownloaded" to state.bytesDownloaded().toDouble(),
    "totalBytesToDownload" to state.totalBytesToDownload().toDouble(),
  )

private fun rejectWith(promise: Promise, error: Exception) {
  val playErrorCode = (error as? AssetPackException)?.errorCode
  promise.reject(REJECTION_CODE, "Play error $playErrorCode: ${error.message}", error)
}

private fun <T> Task<T>.settle(promise: Promise, toResult: (T) -> Any?) {
  addOnSuccessListener { result -> promise.resolve(toResult(result)) }
  addOnFailureListener { error -> rejectWith(promise, error) }
}

private fun stateRecords(states: AssetPackStates): List<Map<String, Any>> =
  states.packStates().values.map(::stateRecord)

class PlayAssetDeliveryModule : Module() {
  private val manager: AssetPackManager by lazy {
    AssetPackManagerFactory.getInstance(appContext.reactContext ?: throw Exceptions.ReactContextLost())
  }

  private val stateListener = AssetPackStateUpdateListener { state ->
    sendEvent(STATE_CHANGED_EVENT, stateRecord(state))
  }

  override fun definition() = ModuleDefinition {
    Name("PlayAssetDelivery")

    Events(STATE_CHANGED_EVENT)

    OnStartObserving(STATE_CHANGED_EVENT) { manager.registerListener(stateListener) }

    OnStopObserving(STATE_CHANGED_EVENT) { manager.unregisterListener(stateListener) }

    AsyncFunction("getPackStates") { packNames: List<String>, promise: Promise ->
      manager.getPackStates(packNames).settle(promise, ::stateRecords)
    }

    AsyncFunction("fetch") { packNames: List<String>, promise: Promise ->
      manager.fetch(packNames).settle(promise, ::stateRecords)
    }

    Function("getAssetsPath") { packName: String ->
      manager.getPackLocation(packName)?.assetsPath()
    }

    AsyncFunction("removePack") { packName: String, promise: Promise ->
      manager.removePack(packName).settle(promise) { null }
    }

    AsyncFunction("showConfirmationDialog") { promise: Promise ->
      val activity = appContext.currentActivity ?: throw Exceptions.MissingActivity()
      manager.showConfirmationDialog(activity).settle(promise) { result -> result == Activity.RESULT_OK }
    }
  }
}
