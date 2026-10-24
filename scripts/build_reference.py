"""Hitung statistik referensi dari dataset -> src/assets/js/ref_data.js
Jalankan ulang jika dataset berubah:  python3 scripts/build_reference.py
"""
import json, pandas as pd, numpy as np
p = pd.read_csv('data/Period_Log.csv')
f = pd.read_csv('data/FedCycleData071012.csv', low_memory=False)
num = lambda c: pd.to_numeric(f[c], errors='coerce').dropna()
q = lambda s: {k: round(float(s.quantile(v)), 1) for k, v in dict(p5=.05, p25=.25, p50=.5, p75=.75, p95=.95).items()}

pain_counts = p.pain_level.value_counts().sort_index()
cum = (pain_counts.cumsum() / len(p) * 100).round(1)
by_pain = p.groupby('pain_level')[['work_hours_lost', 'mood_score', 'energy_level', 'concentration_score']].mean().round(1)
p['stress_bin'] = pd.cut(p.stress_score_cycle, [0, 4, 7, 10], labels=['rendah', 'sedang', 'tinggi'])
p['sleep_bin'] = pd.cut(p.sleep_hours_cycle, [0, 6, 8, 12], labels=['kurang', 'cukup', 'banyak'])
ref = {
    'n_log': int(len(p)), 'n_user': int(p.user_id.nunique()), 'n_fed': int(len(f)),
    'pain': {'mean': round(float(p.pain_level.mean()), 1),
             'pctAtOrBelow': {int(k): float(v) for k, v in cum.items()},
             'pctSevere7plus': round(float((p.pain_level >= 7).mean() * 100), 1),
             'byLevel': {int(k): r.to_dict() for k, r in by_pain.iterrows()}},
    'stressPain': {k: round(float(v), 1) for k, v in p.groupby('stress_bin', observed=True).pain_level.mean().items()},
    'sleepPain': {k: round(float(v), 1) for k, v in p.groupby('sleep_bin', observed=True).pain_level.mean().items()},
    'corrPain': {c: round(float(p[['pain_level', c]].corr().iloc[0, 1]), 2) for c in
                 ['stress_score_cycle', 'sleep_hours_cycle', 'work_hours_lost', 'mood_score', 'energy_level', 'concentration_score']},
    'flow': {k: round(float(v), 1) for k, v in (p.flow_level.value_counts(normalize=True) * 100).items()},
    'pmsPct': round(float((p.pms_symptoms == 'Yes').mean() * 100), 1),
    'cycleLen': {'mean': round(float(num('LengthofCycle').mean()), 1), **q(num('LengthofCycle'))},
    'cycleLenLog': {'mean': round(float(p.cycle_length_days.mean()), 1), **q(p.cycle_length_days)},
    'mensesLen': {'mean': round(float(num('LengthofMenses').mean()), 1), **q(num('LengthofMenses'))},
    'ovulationDay': {'mean': round(float(num('EstimatedDayofOvulation').mean()), 1), **q(num('EstimatedDayofOvulation'))},
    'bmi': {'mean': round(float(num('BMI').mean()), 1), **q(num('BMI'))},
}
open('src/assets/js/ref_data.js', 'w').write('/* Dibuat otomatis oleh scripts/build_reference.py dari data/*.csv */\nconst REF = ' + json.dumps(ref, indent=1) + ';\n')
print('ok', len(json.dumps(ref)), 'bytes')
