# Real-Time Sign Language Interpreter

Welcome to the Real-Time Sign Language Interpreter! This project uses machine learning and computer vision to recognize and interpret American Sign Language (ASL) gestures in real time. The interpreter currently recognizes individual letters and signed words, providing both on-screen visualization and audio output.

## Key Features

- **Hand Gesture Detection:** The project uses MediaPipe for accurate and efficient hand landmark detection. This allows the system to track hand movements and gestures in real-time using just a webcam.

- **Letter Recognition:** A Logistic Regression model is trained on a custom dataset of hand landmarks to classify individual ASL letters. The system can recognize most static letters of the ASL alphabet.

- **Word Recognition:** A Random Forest Classifier is used to recognize dynamic hand movements corresponding to signed words. The model is trained on sequences of hand movements, allowing it to recognize words that require motion, such as 'hello' and 'help'.

- **Audio Feedback:** The project provides audio output for recognized letters and words using gTTS (Google Text-to-Speech) and pyGame. This allows the system to 'speak' the interpreted signs, making it accessible for both deaf and hearing individuals.

- **Data Collection and Augmentation:** The system allows for real-time data collection and augmentation. Users can capture new hand gestures and automatically add them to the training dataset, facilitating the continuous improvement of the models.

## How It Works

1. **Hand Detection:** The `handDetector` class (located in `hand_detector2.py`) uses MediaPipe to detect and track hand landmarks in real time. The detected landmarks are used as inputs for the letter and word recognition models.

2. **Letter Recognition:** The `letter_interpreter.py` script captures hand landmarks and uses a trained Logistic Regression model to classify individual letters. When a letter is recognized, it is displayed on the screen and added to the current word being spelled. If the same letter is detected consistently, it is added to the word.

3. **Word Recognition:** The `word_interpreter.py` script tracks sequences of hand movements over multiple frames. These sequences are used to classify signed words with the help of a Random Forest Classifier. Recognized words are displayed and can be dictated via audio output.

4. **Audio Output:** The system uses gTTS to convert recognized words into speech. The audio is played using pyGame, making the system interactive and user-friendly.

5. **Data Collection:** The system allows users to collect new gesture data by pressing specific keys. This data is automatically saved and can be used to retrain the models, enhancing the system's recognition capabilities.

## Getting Started
### Installation

### Windows quick start (recommended, stable)

Use this flow to avoid MediaPipe / Python-version mismatch errors:

1. Create a dedicated Python 3.11 environment:

   ```
   py -3.11 -m venv .venv311
   .\.venv311\Scripts\activate
   ```

2. Install dependencies:

   ```
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```

3. Start backend (always from this env):

   ```
   .\start_backend.ps1
   ```

If you see repeated `503` on `/api/status` or `/api/prediction`, first ensure port `5000` is served by `.venv311` and not another Python environment.

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/sign-language-interpreter.git
   ```
2. Start a virtual environment
   ```
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install the required Python packages (API + sign detection; **no matplotlib/JAX** — avoids building C extensions without Visual Studio):

   ```
   pip install -r requirements.txt
   ```

   Use **Python 3.11 or 3.12** if TensorFlow or other packages report “no matching distribution”.

   Optional desktop audio (`letter_interpreter.py`): `pip install -r requirements-optional-tools.txt`

4. Run the interpreter scripts:

   - For letter recognition:
     ```
     python letter_interpreter.py
     ```

   - For word recognition:
     ```
     python word_interpreter.py
     ```

## Web Dashboard (React + Tailwind + TypeScript)

This project now includes a modern frontend dashboard in `frontend/` that is wired to a Python API (`api_server.py`) for process control.

### Backend API setup

1. Activate the correct virtual environment (`.venv311` recommended on Windows).
2. Start the API server:

   ```
   .\start_backend.ps1
   ```

3. The API runs on `http://127.0.0.1:5000` by default.
   You can change host/port:

   ```
   $env:API_HOST="127.0.0.1"
   $env:API_PORT="5000"
   python api_server.py
   ```

### Sign detection (which model runs?)

The API picks a detector automatically:

1. **Keypoint TFLite (recommended)** — If `supportbackend/American-Sign-Language-Detection/model/keypoint_classifier/keypoint_classifier.tflite` and `keypoint_classifier_label.csv` exist **and** TensorFlow (or `tflite-runtime`) loads, the server uses the same pipeline as that project: MediaPipe → wrist-relative normalized landmarks → TFLite (ASL **A–Z**). `requirements.txt` includes **`tensorflow`** (works on most Windows/macOS/Linux with **Python 3.11–3.12**). If TensorFlow has no wheel for your Python version, install **`tflite-runtime`** when available, or rely on the sklearn fallback below.

2. **Sklearn legacy** — If the keypoint bundle is missing or fails to load, the API uses `letter_model.joblib` (or trains from `hand_signals.csv` on first run).

Force the sklearn path only:

```
$env:USE_LEGACY_SIGN_MODEL="1"
python api_server.py
```

The web UI shows **Detector:** … under Sign → English. `/api/status` and `/api/health` include `sign_detector`: `keypoint_tflite` | `sklearn_legacy` | `loading` | `failed`.

### Frontend setup

1. Open a second terminal and go to the frontend folder:

   ```
   cd frontend
   npm install
   ```

2. **API URL (dev):** With `npm run dev`, the app calls same-origin `/api` and Vite proxies to Flask on port 5000 (`frontend/vite.config.ts`). You do **not** need a `.env` file unless you want a custom backend URL.

   Optional `.env` in `frontend/`:

   ```
   VITE_API_BASE_URL=http://127.0.0.1:5000
   ```

3. Start the frontend:

   ```
   npm run dev
   ```

4. Open the URL shown by Vite (usually `http://127.0.0.1:5173`).

### Dashboard capabilities

- **Sign → English:** start/stop letter or word camera session; live browser camera; model confidence and translation text.
- **English → Sign:** type English text and load **ASL manual alphabet** (finger spelling) reference images via `/api/text-to-sign` (Wikimedia Commons URLs resolved on the server).
- Inspect recent backend logs.

Finger spelling is a reference view only; full ASL uses different grammar, and letters **J** and **Z** are normally produced with motion.

### Usage

- Press `q` to quit the interpreter.
- Press `c` to capture new gesture data for training.

## Future Improvements

- **Full ASL Alphabet:** Incorporate dynamic letters like 'J' and 'Z' to complete the ASL alphabet.
- **Expanded Vocabulary:** Train the system to recognize a broader set of words and phrases.
- **User Profiles:** Implement user profiles to allow personalized gesture models.
- **Mobile Integration:** Develop a mobile app version to make the interpreter portable.

## Acknowledgments

This project is inspired by the desire to make communication more accessible and inclusive for the deaf community.

## Contact

If you have any questions or feedback, feel free to reach out!

- **Email:** [laplace.sallis@gmail.com](mailto:laplace.sallis@gmail.com)
- **LinkedIn:** [LaPlace Sallis IV](https://www.linkedin.com/in/laplace-sallis-iv-bbbb602a8/)
- **GitHub:** [laplaces42](https://github.com/laplaces42)

You can also open an issue on this repository if you have any questions or need support.
