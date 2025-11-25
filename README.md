# ⏱Just_3_Seconds

> [!TIP]
> **Stop at Exactly 3 Seconds**<br>
> The rules are simple: stop the stopwatch after 3 seconds.<br>
<br>

## 🕹️How to play

> [!NOTE]
> Website: [Just_3_Seconds](https://niwatoriiiiiiiii.github.io/Just_3_Seconds/)<br>
<br>

## ✨features

- **Rating system**<br>
  - The maximum rating is 10.00. Keep it up!<br><br>
- **there are 18 achievements**<br>
  - If you complete all achievements, you become a 3‑second timer.<br>
<br>

## 📈Rating Calculation

**The rating is calculated using the following formula**:<br>
For ease of understanding, the subscripts are one-based indexes.<br><br>

```math
EachPerf = 0.2 * (1 - \sqrt{\min(EachErrorMs, 500) / 500})
```

```math
Rating = \sum\nolimits_{i=1}^{50} Perf[i]
```

<br><br>
The rating is calculated using the scores from the last 50 games.<br>
The maximum rating is 10.00. (Each performance is worth 0.20)<br>
