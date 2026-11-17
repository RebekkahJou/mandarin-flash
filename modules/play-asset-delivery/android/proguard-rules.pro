# Play Asset Delivery uses WorkManager, whose Room database (Room 2.5) is found by class name at
# startup. Without these rules R8 renames it and release builds crash on launch.
-keep class * extends androidx.room.RoomDatabase { <init>(); }
-keep class androidx.work.impl.WorkDatabase
