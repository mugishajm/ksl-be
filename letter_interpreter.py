import hand_detector2 as hdm
import cv2
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.linear_model import LogisticRegression
import time
import io   
# pyrefly: ignore [missing-import]
from gtts import gTTS
import pygame
import warnings

# Ignore all warnings
warnings.filterwarnings("ignore")

#Read and process data
data = pd.read_csv('hand_signals.csv')
data = data.loc[:, ~data.columns.str.contains('^Unnamed')]

X = data.drop('letter', axis=1)
y = data['letter']

#Split the data into training and test sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

#Initialize and train the Logistic regressor
model = LogisticRegression(max_iter=200)
model.fit(X_train, y_train)

def speech(text):
    '''
    Converts a piece of text into speech using pyGame and gTTS libraries

    Parameters:
    text (string): A string representing the text to be converted into speech

    Returns: None
    '''

    #Initializes the text
    myobj = gTTS(text=text, lang='en', slow=False)
    mp3_fp = io.BytesIO()
    myobj.write_to_fp(mp3_fp)
    mp3_fp.seek(0)

    # Load the BytesIO object as a sound
    pygame.mixer.music.load(mp3_fp, 'mp3')
    pygame.mixer.music.play()

    # Keep the program running while the sound plays
    while pygame.mixer.music.get_busy():
        pygame.time.Clock().tick(10)

def main():
    '''
    Main function to run the hand gesture recognition system.
    Captures video input, detects hand landmarks, and classifies hand gestures in real-time.

    The function also handles the collection and storage of new gesture data.

    Inputs: None

    Returns: None
    '''
    
    pygame.mixer.init()
    signal_data = {}
    cap = cv2.VideoCapture(0)
    detector = hdm.handDetector()
    letters = [0]
    word = ''
    words = []
    start = time.time()
    end = time.time()

    while True:
        success, img = cap.read()
        img = cv2.flip(img, 1)
        key = cv2.waitKey(1) & 0xFF

        img = detector.find_hands(img, draw=False)
        landmarks = detector.find_position(img)
        
        confidence_threshold = .7

        if not landmarks:

            start = time.time()
            idle_timer = start-end

            if idle_timer >= 3 and word != '':

                if word[-1] != ' ':
                    
                    speech(word)
                    words.append(word)
                    word =word + ' '

        if landmarks and len(landmarks) == 1:
            
            lmlist = landmarks[0][1]
            
            end = time.time()

            p1 = (min(lmlist[x][1] for x in range(len(lmlist))) - 25, min(lmlist[x][2] for x in range(len(lmlist))) - 25)
            p2 = (max(lmlist[x][1] for x in range(len(lmlist))) + 25, max(lmlist[x][2] for x in range(len(lmlist))) + 25)
            cv2.rectangle(img, p1, p2, (255,255,255), 3)

            location_vector = np.array([coord for lm in lmlist for coord in lm[1:3]]).reshape(1, -1)
            
            probabilities = model.predict_proba(location_vector)
            max_prob = np.max(probabilities)
            if max_prob > confidence_threshold:
                predicted_letter = model.predict(location_vector)[0]
                if predicted_letter == letters[-1]:
                    letters.append(predicted_letter)
                else:
                    letters = [predicted_letter]
                cv2.putText(img, predicted_letter, (p1[0], p1[1] - 10), cv2.QT_FONT_NORMAL, 3, (255, 255, 255), 3)
            
            if len(letters) == 20:
                word = word + letters[0]
                letters = [0]
                print(word)
        cv2.imshow("Image", img)

        if key == ord('c') and lmlist:
            for item in lmlist:
                if f'{item[0]}x' in signal_data:
                    signal_data[f'{item[0]}x'].append(item[1])
                else:
                    signal_data[f'{item[0]}x'] = [item[1]]
                if f'{item[0]}y' in signal_data:
                    signal_data[f'{item[0]}y'].append(item[2])
                else:
                    signal_data[f'{item[0]}y'] = [item[2]]
        
        #If 1 is pressed, stop the program
        if key == ord('q'):
            break
        
    #Adds the data to the DataFrame if there is data to be added
    if signal_data:
        signal_data['letter'] = ['a'] * len(signal_data['0x'])
        new_signals = pd.DataFrame(signal_data)
        existing_signals = pd.read_csv('hand_signals.csv')
        updated_stats = pd.concat([existing_signals, new_signals], ignore_index=True)
        updated_stats.to_csv('hand_signals.csv', index=False)

#Runs the program
if __name__ == '__main__':
    main()