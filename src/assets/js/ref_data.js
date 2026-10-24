/* Dibuat otomatis oleh scripts/build_reference.py dari data/*.csv */
const REF = {
 "n_log": 17976,
 "n_user": 2000,
 "n_fed": 1665,
 "pain": {
  "mean": 4.9,
  "pctAtOrBelow": {
   "1": 7.7,
   "2": 16.2,
   "3": 28.9,
   "4": 45.0,
   "5": 61.2,
   "6": 76.2,
   "7": 87.2,
   "8": 94.4,
   "9": 97.9,
   "10": 100.0
  },
  "pctSevere7plus": 23.8,
  "byLevel": {
   "1": {
    "work_hours_lost": 1.2,
    "mood_score": 8.8,
    "energy_level": 8.9,
    "concentration_score": 9.2
   },
   "2": {
    "work_hours_lost": 1.8,
    "mood_score": 8.3,
    "energy_level": 8.3,
    "concentration_score": 8.7
   },
   "3": {
    "work_hours_lost": 2.4,
    "mood_score": 7.9,
    "energy_level": 7.8,
    "concentration_score": 8.2
   },
   "4": {
    "work_hours_lost": 2.9,
    "mood_score": 7.5,
    "energy_level": 7.3,
    "concentration_score": 7.8
   },
   "5": {
    "work_hours_lost": 3.5,
    "mood_score": 7.0,
    "energy_level": 6.8,
    "concentration_score": 7.3
   },
   "6": {
    "work_hours_lost": 4.0,
    "mood_score": 6.6,
    "energy_level": 6.2,
    "concentration_score": 6.8
   },
   "7": {
    "work_hours_lost": 4.6,
    "mood_score": 6.1,
    "energy_level": 5.7,
    "concentration_score": 6.3
   },
   "8": {
    "work_hours_lost": 5.1,
    "mood_score": 5.7,
    "energy_level": 5.1,
    "concentration_score": 5.9
   },
   "9": {
    "work_hours_lost": 5.6,
    "mood_score": 5.3,
    "energy_level": 4.6,
    "concentration_score": 5.4
   },
   "10": {
    "work_hours_lost": 6.2,
    "mood_score": 4.9,
    "energy_level": 4.1,
    "concentration_score": 5.0
   }
  }
 },
 "stressPain": {
  "rendah": 2.8,
  "sedang": 4.7,
  "tinggi": 6.6
 },
 "sleepPain": {
  "kurang": 5.4,
  "cukup": 4.8,
  "banyak": 4.3
 },
 "corrPain": {
  "stress_score_cycle": 0.61,
  "sleep_hours_cycle": -0.17,
  "work_hours_lost": 0.82,
  "mood_score": -0.65,
  "energy_level": -0.71,
  "concentration_score": -0.73
 },
 "flow": {
  "Moderate": 49.3,
  "Light": 37.1,
  "Heavy": 13.7
 },
 "pmsPct": 29.5,
 "cycleLen": {
  "mean": 29.3,
  "p5": 25.0,
  "p25": 27.0,
  "p50": 29.0,
  "p75": 31.0,
  "p95": 37.0
 },
 "cycleLenLog": {
  "mean": 27.8,
  "p5": 24.0,
  "p25": 26.0,
  "p50": 28.0,
  "p75": 29.0,
  "p95": 32.0
 },
 "mensesLen": {
  "mean": 5.2,
  "p5": 3.0,
  "p25": 4.0,
  "p50": 5.0,
  "p75": 6.0,
  "p95": 7.0
 },
 "ovulationDay": {
  "mean": 16.0,
  "p5": 11.0,
  "p25": 14.0,
  "p50": 15.0,
  "p75": 18.0,
  "p95": 23.0
 },
 "bmi": {
  "mean": 25.2,
  "p5": 19.0,
  "p25": 21.1,
  "p50": 24.1,
  "p75": 27.9,
  "p95": 36.1
 }
};
