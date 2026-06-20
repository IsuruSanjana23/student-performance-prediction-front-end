import { useState, useEffect, useRef } from "react";
import "./App.css";

function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const startTime = useRef<number | null>(null);
  const raf = useRef<number>(0);

  useEffect(() => {
    startTime.current = null;
    const step = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) {
        raf.current = requestAnimationFrame(step);
      }
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);

  return <>{display.toFixed(1)}</>;
}

function App() {
  const [formData, setFormData] = useState({
    socioeconomicScore: "",
    studyHours: "",
    sleepHours: "",
    attendance: ""
  });

  const [prediction, setPrediction] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState(0);

  const limits: Record<string, { min: number; max: number }> = {
    socioeconomicScore: { min: 0, max: 100 },
    studyHours: { min: 0, max: 24 },
    sleepHours: { min: 0, max: 24 },
    attendance: { min: 0, max: 100 },
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const limit = limits[name];
    if (limit && value !== "") {
      const num = Number(value);
      if (num < limit.min) return;
      if (num > limit.max) return;
    }
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  async function predictGrade() {
    if (!formData.socioeconomicScore || !formData.studyHours || 
        !formData.sleepHours || !formData.attendance) {
      setError("Please fill in all fields");
      setErrorKey(k => k + 1);
      return;
    }

    const attendanceNum = Number(formData.attendance);
    if (attendanceNum < 0 || attendanceNum > 100) {
      setError("Attendance must be between 0 and 100");
      setErrorKey(k => k + 1);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("https://student-performance-prediction-production.up.railway.app/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          socioeconomic_score: Number(formData.socioeconomicScore),
          study_hours: Number(formData.studyHours),
          sleep_hours: Number(formData.sleepHours),
          attendance: Number(formData.attendance),
        }),
      });

      if (!response.ok) {
        throw new Error("Prediction failed. Please try again.");
      }

      const data = await response.json();
      setPrediction(data.predicted_grade);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setErrorKey(k => k + 1);
    } finally {
      setIsLoading(false);
    }
  }

  const getGradeColor = (grade: number) => {
    if (grade >= 75) return "#10b981";
    if (grade >= 65) return "#3b82f6";
    if (grade >= 55) return "#f59e0b";
    if (grade >= 45) return "#f97316";
    return "#ef4444";
  };

  const getGradeLetter = (grade: number) => {
    if (grade >= 75) return "A";
    if (grade >= 65) return "B";
    if (grade >= 55) return "C";
    if (grade >= 45) return "D";
    return "F";
  };

  return (
    <div className="app">
      <header className="header animate-header">
        <h1>Student Grade Predictor</h1>
        <p className="subtitle">Enter your academic metrics to predict your final grade</p>
      </header>

      <main className="main-content">
        <div className="predictor-container">
          <div className="input-section">
            <h2 className="animate-header">Input Metrics</h2>

            <div className="input-group animate-input">
              <label htmlFor="socioeconomicScore">
                Socioeconomic Score
                <span className="hint">(0-100 scale)</span>
              </label>
              <input
                id="socioeconomicScore"
                name="socioeconomicScore"
                type="number"
                min="0"
                max="100"
                placeholder="Enter score (0-100)"
                value={formData.socioeconomicScore}
                onChange={handleChange}
                className="input-field"
              />
              <div className="range-hint">Higher score = better resources</div>
            </div>

            <div className="input-group animate-input">
              <label htmlFor="studyHours">
                Daily Study Hours
                <span className="hint">(hours/day)</span>
              </label>
              <input
                id="studyHours"
                name="studyHours"
                type="number"
                min="0"
                max="24"
                step="0.5"
                placeholder="Enter hours (0-24)"
                value={formData.studyHours}
                onChange={handleChange}
                className="input-field"
              />
              <div className="range-hint">Recommended: 2-4 hours/day</div>
            </div>

            <div className="input-group animate-input">
              <label htmlFor="sleepHours">
                Daily Sleep Hours
                <span className="hint">(hours/day)</span>
              </label>
              <input
                id="sleepHours"
                name="sleepHours"
                type="number"
                min="0"
                max="24"
                step="0.5"
                placeholder="Enter hours (0-24)"
                value={formData.sleepHours}
                onChange={handleChange}
                className="input-field"
              />
              <div className="range-hint">Recommended: 7-9 hours/night</div>
            </div>

            <div className="input-group animate-input">
              <label htmlFor="attendance">
                Class Attendance
                <span className="hint">(%)</span>
              </label>
              <input
                id="attendance"
                name="attendance"
                type="number"
                min="0"
                max="100"
                placeholder="Enter percentage (0-100)"
                value={formData.attendance}
                onChange={handleChange}
                className="input-field"
              />
              <div className="range-hint">Perfect attendance = 100%</div>
            </div>

            {error && <div key={errorKey} className="error-message animate-error">{error}</div>}

            <div className="animate-button">
              <button
                onClick={predictGrade}
                disabled={isLoading}
                className="predict-button"
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Predicting...
                  </>
                ) : (
                  "Predict Grade"
                )}
              </button>
            </div>
          </div>

          {prediction !== null && (
            <div className="result-section animate-result">
              <div className="result-card">
                <h2>Prediction Result</h2>
                <div
                  className="grade-display animate-grade-circle"
                  style={{ backgroundColor: getGradeColor(prediction) }}
                >
                  <div className="grade-number">
                    <AnimatedNumber value={prediction} />
                  </div>
                  <div className="grade-letter">{getGradeLetter(prediction)}</div>
                </div>

                <div className="grade-interpretation animate-grade-interp">
                  <h3>Grade Interpretation</h3>
                  <p>
                    Based on your input metrics, your predicted final grade is
                    <strong> {getGradeLetter(prediction)} ({prediction.toFixed(1)}%)</strong>.
                  </p>

                  {prediction >= 90 && (
                    <p className="positive">Excellent performance! Keep up the great work!</p>
                  )}
                  {prediction >= 80 && prediction < 90 && (
                    <p className="positive">Good performance! You're on track for success.</p>
                  )}
                  {prediction >= 70 && prediction < 80 && (
                    <p className="warning">Average performance. Consider increasing study hours.</p>
                  )}
                  {prediction >= 60 && prediction < 70 && (
                    <p className="warning">Below average. Focus on attendance and study habits.</p>
                  )}
                  {prediction < 60 && (
                    <p className="negative">Needs improvement. Seek academic support.</p>
                  )}
                </div>

                <div className="input-summary animate-summary">
                  <h3>Your Input</h3>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <span className="summary-label">Socioeconomic Score</span>
                      <span className="summary-value">{formData.socioeconomicScore}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Study Hours</span>
                      <span className="summary-value">{formData.studyHours}h/week</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Sleep Hours</span>
                      <span className="summary-value">{formData.sleepHours}h/day</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Attendance</span>
                      <span className="summary-value">{formData.attendance}%</span>
                    </div>
                  </div>
                </div>

                <div className="animate-reset-btn">
                  <button
                    onClick={() => {
                      setPrediction(null);
                      setFormData({
                        socioeconomicScore: "",
                        studyHours: "",
                        sleepHours: "",
                        attendance: ""
                      });
                    }}
                    className="reset-button"
                  >
                    Try Another Prediction
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {prediction === null && (
          <div className="info-section">
            <h3 className="animate-header">How It Works</h3>
            <div className="info-cards">
              <div className="info-card animate-card">
                <h4>Accurate Predictions</h4>
                <p>Our AI model analyzes multiple factors to predict your final grade with high accuracy.</p>
              </div>
              <div className="info-card animate-card">
                <h4>Data-Driven</h4>
                <p>Based on thousands of student records and academic performance data.</p>
              </div>
              <div className="info-card animate-card">
                <h4>Actionable Insights</h4>
                <p>Get personalized recommendations to improve your academic performance.</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;