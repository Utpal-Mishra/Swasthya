package com.utpalmishra.swasthya

import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.HealthConnectFeatures
import androidx.health.connect.client.feature.ExperimentalMindfulnessSessionApi
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.HeartRateVariabilityRmssdRecord
import androidx.health.connect.client.records.MindfulnessSessionRecord
import androidx.health.connect.client.records.OxygenSaturationRecord
import androidx.health.connect.client.records.RestingHeartRateRecord
import androidx.health.connect.client.records.SkinTemperatureRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import org.json.JSONArray
import org.json.JSONObject

@OptIn(ExperimentalMindfulnessSessionApi::class)
class HealthSnapshotReader(private val client: HealthConnectClient) {

    companion object {
        val stepsPermission = HealthPermission.getReadPermission(StepsRecord::class)
        val heartPermission = HealthPermission.getReadPermission(HeartRateRecord::class)
        val restingHeartPermission = HealthPermission.getReadPermission(RestingHeartRateRecord::class)
        val sleepPermission = HealthPermission.getReadPermission(SleepSessionRecord::class)
        val oxygenPermission = HealthPermission.getReadPermission(OxygenSaturationRecord::class)
        val hrvPermission = HealthPermission.getReadPermission(HeartRateVariabilityRmssdRecord::class)
        val skinTemperaturePermission = HealthPermission.getReadPermission(SkinTemperatureRecord::class)
        val mindfulnessPermission = HealthPermission.getReadPermission(MindfulnessSessionRecord::class)

        private val corePermissions = setOf(
            stepsPermission,
            heartPermission,
            restingHeartPermission,
            sleepPermission,
            oxygenPermission,
            hrvPermission
        )

        fun permissionsFor(client: HealthConnectClient): Set<String> {
            val supported = corePermissions.toMutableSet()
            if (client.features.getFeatureStatus(HealthConnectFeatures.FEATURE_SKIN_TEMPERATURE) == HealthConnectFeatures.FEATURE_STATUS_AVAILABLE) {
                supported += skinTemperaturePermission
            }
            if (client.features.getFeatureStatus(HealthConnectFeatures.FEATURE_MINDFULNESS_SESSION) == HealthConnectFeatures.FEATURE_STATUS_AVAILABLE) {
                supported += mindfulnessPermission
            }
            return supported
        }
    }

    private fun skinTemperatureAvailable(): Boolean =
        client.features.getFeatureStatus(HealthConnectFeatures.FEATURE_SKIN_TEMPERATURE) == HealthConnectFeatures.FEATURE_STATUS_AVAILABLE

    private fun mindfulnessAvailable(): Boolean =
        client.features.getFeatureStatus(HealthConnectFeatures.FEATURE_MINDFULNESS_SESSION) == HealthConnectFeatures.FEATURE_STATUS_AVAILABLE

    suspend fun readSummary(granted: Set<String>): JSONObject {
        val end = Instant.now()
        val dayStart = end.minus(Duration.ofHours(24))
        val baselineEnd = dayStart
        val baselineStart = baselineEnd.minus(Duration.ofDays(14))

        val steps = if (stepsPermission in granted) readSteps(dayStart, end) else null
        val avgHeart = if (heartPermission in granted) readAverageHeartRate(dayStart, end) else null
        val resting = if (restingHeartPermission in granted) readAverageRestingHeartRate(dayStart, end) else null
        val baselineResting = if (restingHeartPermission in granted) readAverageRestingHeartRate(baselineStart, baselineEnd) else null
        val sleep = if (sleepPermission in granted) readSleepMinutes(dayStart, end) else null
        val baselineSleepTotal = if (sleepPermission in granted) readSleepMinutes(baselineStart, baselineEnd) else null
        val baselineSleep = baselineSleepTotal?.div(14.0)
        val hrv = if (hrvPermission in granted) readAverageHrv(dayStart, end) else null
        val baselineHrv = if (hrvPermission in granted) readAverageHrv(baselineStart, baselineEnd) else null
        val spo2 = if (oxygenPermission in granted) readAverageSpo2(dayStart, end) else null
        val skinDelta = if (skinTemperaturePermission in granted && skinTemperatureAvailable()) readAverageSkinTemperatureDelta(dayStart, end) else null
        val mindfulnessMinutes = if (mindfulnessPermission in granted && mindfulnessAvailable()) readMindfulnessMinutes(dayStart, end) else null
        val origins = readOrigins(dayStart, end, granted)
        val samsungOrigin = origins.any { it.contains("shealth", ignoreCase = true) || it.contains("samsung", ignoreCase = true) }

        val scope = mutableListOf<String>()
        if (stepsPermission in granted) scope += "steps"
        if (heartPermission in granted) scope += "heart_rate"
        if (restingHeartPermission in granted) scope += "resting_heart_rate"
        if (sleepPermission in granted) scope += "sleep"
        if (oxygenPermission in granted) scope += "oxygen_saturation"
        if (hrvPermission in granted) scope += "hrv_rmssd"
        if (skinTemperaturePermission in granted && skinTemperatureAvailable()) scope += "skin_temperature"
        if (mindfulnessPermission in granted && mindfulnessAvailable()) scope += "mindfulness"

        return JSONObject().apply {
            put("schema_version", "1.1")
            put("date", LocalDate.now().toString())
            put("generated_at", Instant.now().toString())
            put("source", "health_connect")
            put("data_origin", if (samsungOrigin) "Samsung Health via Health Connect" else "Health Connect")
            put("data_origins", JSONArray(origins.sorted()))
            put("consent_scope", JSONArray(scope))
            put("sleep", JSONObject().apply {
                putNullable("duration_minutes", sleep)
                putNullable("baseline_delta_minutes", if (sleep != null && baselineSleep != null) sleep - baselineSleep else null)
                put("consistency_minutes", JSONObject.NULL)
            })
            put("heart", JSONObject().apply {
                putNullable("resting_bpm", resting)
                putNullable("average_bpm", avgHeart)
                putNullable("resting_bpm_baseline_delta", if (resting != null && baselineResting != null) resting - baselineResting else null)
                putNullable("hrv_ms", hrv)
                putNullable("hrv_baseline_delta", if (hrv != null && baselineHrv != null) hrv - baselineHrv else null)
            })
            put("activity", JSONObject().apply {
                putNullable("steps", steps)
                put("active_minutes", JSONObject.NULL)
                put("minutes_since_exercise", JSONObject.NULL)
            })
            put("recovery", JSONObject().apply {
                put("energy_score", JSONObject.NULL)
                putNullable("skin_temperature_baseline_delta_c", skinDelta)
                putNullable("sleep_spo2_percent", spo2)
            })
            put("mindfulness", JSONObject().apply {
                putNullable("minutes_24h", mindfulnessMinutes)
            })
            put("mood_anchor", JSONObject.NULL)
        }
    }

    private suspend fun readSteps(start: Instant, end: Instant): Long? {
        val result = client.aggregate(AggregateRequest(setOf(StepsRecord.COUNT_TOTAL), TimeRangeFilter.between(start, end)))
        return result[StepsRecord.COUNT_TOTAL]
    }

    private suspend fun readAverageHeartRate(start: Instant, end: Instant): Double? {
        val result = client.aggregate(AggregateRequest(setOf(HeartRateRecord.BPM_AVG), TimeRangeFilter.between(start, end)))
        return result[HeartRateRecord.BPM_AVG]?.toDouble()
    }

    private suspend fun readAverageRestingHeartRate(start: Instant, end: Instant): Double? {
        val result = client.aggregate(AggregateRequest(setOf(RestingHeartRateRecord.BPM_AVG), TimeRangeFilter.between(start, end)))
        return result[RestingHeartRateRecord.BPM_AVG]?.toDouble()
    }

    private suspend fun readSleepMinutes(start: Instant, end: Instant): Double? {
        val result = client.aggregate(AggregateRequest(setOf(SleepSessionRecord.SLEEP_DURATION_TOTAL), TimeRangeFilter.between(start, end)))
        return result[SleepSessionRecord.SLEEP_DURATION_TOTAL]?.toMinutes()?.toDouble()
    }

    private suspend fun readAverageHrv(start: Instant, end: Instant): Double? {
        val records = client.readRecords(ReadRecordsRequest(HeartRateVariabilityRmssdRecord::class, timeRangeFilter = TimeRangeFilter.between(start, end))).records
        return records.map { it.heartRateVariabilityMillis }.takeIf { it.isNotEmpty() }?.average()
    }

    private suspend fun readAverageSpo2(start: Instant, end: Instant): Double? {
        val records = client.readRecords(ReadRecordsRequest(OxygenSaturationRecord::class, timeRangeFilter = TimeRangeFilter.between(start, end))).records
        return records.map { it.percentage.value }.takeIf { it.isNotEmpty() }?.average()
    }

    private suspend fun readAverageSkinTemperatureDelta(start: Instant, end: Instant): Double? {
        val records = client.readRecords(ReadRecordsRequest(SkinTemperatureRecord::class, timeRangeFilter = TimeRangeFilter.between(start, end))).records
        return records.flatMap { it.deltas }.map { it.delta.inCelsius }.takeIf { it.isNotEmpty() }?.average()
    }

    private suspend fun readMindfulnessMinutes(start: Instant, end: Instant): Double? {
        val result = client.aggregate(AggregateRequest(setOf(MindfulnessSessionRecord.MINDFULNESS_DURATION_TOTAL), TimeRangeFilter.between(start, end)))
        return result[MindfulnessSessionRecord.MINDFULNESS_DURATION_TOTAL]?.toMinutes()?.toDouble()
    }

    private suspend fun readOrigins(start: Instant, end: Instant, granted: Set<String>): Set<String> {
        val origins = mutableSetOf<String>()
        val filter = TimeRangeFilter.between(start, end)
        if (stepsPermission in granted) client.readRecords(ReadRecordsRequest(StepsRecord::class, timeRangeFilter = filter)).records.forEach { origins += it.metadata.dataOrigin.packageName }
        if (sleepPermission in granted) client.readRecords(ReadRecordsRequest(SleepSessionRecord::class, timeRangeFilter = filter)).records.forEach { origins += it.metadata.dataOrigin.packageName }
        if (restingHeartPermission in granted) client.readRecords(ReadRecordsRequest(RestingHeartRateRecord::class, timeRangeFilter = filter)).records.forEach { origins += it.metadata.dataOrigin.packageName }
        if (hrvPermission in granted) client.readRecords(ReadRecordsRequest(HeartRateVariabilityRmssdRecord::class, timeRangeFilter = filter)).records.forEach { origins += it.metadata.dataOrigin.packageName }
        if (oxygenPermission in granted) client.readRecords(ReadRecordsRequest(OxygenSaturationRecord::class, timeRangeFilter = filter)).records.forEach { origins += it.metadata.dataOrigin.packageName }
        if (skinTemperaturePermission in granted && skinTemperatureAvailable()) client.readRecords(ReadRecordsRequest(SkinTemperatureRecord::class, timeRangeFilter = filter)).records.forEach { origins += it.metadata.dataOrigin.packageName }
        if (mindfulnessPermission in granted && mindfulnessAvailable()) client.readRecords(ReadRecordsRequest(MindfulnessSessionRecord::class, timeRangeFilter = filter)).records.forEach { origins += it.metadata.dataOrigin.packageName }
        return origins.filter { it.isNotBlank() }.toSet()
    }

    private fun JSONObject.putNullable(key: String, value: Number?) {
        if (value == null) put(key, JSONObject.NULL) else put(key, value)
    }
}
