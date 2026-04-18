import cv2
import mediapipe as mp


def _solutions_module():
    """
    MediaPipe package layouts differ by build:
    - classic: mediapipe.solutions (via mp.solutions)
    - some newer/minimal wheels: mediapipe.python.solutions only
    """
    sol = getattr(mp, "solutions", None)
    if sol is not None:
        return sol
    try:
        import mediapipe.python.solutions as mp_solutions  # type: ignore
    except Exception as exc:
        raise RuntimeError(
            "MediaPipe solutions API is unavailable in this environment."
        ) from exc
    return mp_solutions


class handDetector():
    '''
    A class for detecting and tracking hands in real-time video using MediaPipe

    Attributes:
    mode (bool): Determines if the detector will run in video mode (False) or in static image mode (True)
    max_hands (int): The maximum number of hands to detect and track
    detection_con (float): The minimum confidence value for the hand detection to be considered successful
    presence_con (float): The minimum confidence value for the presence of hand landmarks
    track_con (float): The minimum confidence value for hand landmark tracking to be considered successful

    Methods:
    find_hands(img, draw=True): Processes an image and optionally draws the hand landmarks
    find_position(img, draw=True): Returns the position of hand landmarks in the image and optionally returns draws the hand landmarks
    '''

    def __init__(self, mode=False, max_hands=2, detection_con=.5, presence_con=.5, track_con=.5) -> None:
        '''
        Initializes the handDetector object with the specified parameters

        Parameters:
        mode (bool): Determines if the detector will run in video mode (False) or in static image mode (True)
        max_hands (int): The maximum number of hands to detect and track
        detection_con (float): The minimum confidence value for the hand detection to be considered successful
        presence_con (float): The minimum confidence value for the presence of hand landmarks
        track_con (float): The minimum confidence value for hand landmark tracking to be considered successful
        '''

        self.mode = mode
        self.max_hands = max_hands
        self.detection_con = detection_con
        self.presence_con = presence_con
        self.track_con = track_con
        
        solutions = _solutions_module()
        self.mp_hands = solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=self.mode,
            max_num_hands=self.max_hands,
            min_detection_confidence=self.detection_con,
            min_tracking_confidence=self.track_con
        )
        self.mp_draw = solutions.drawing_utils


    def find_hands(self, img, draw=True):
        '''
        Processes an image and optionally draws the landmarks

        Parameters:
        img (ndarray): The input image where hands are detected
        draw (bool): Determines whether to draw the hand landmarks (True) or not (False)

        Returns:
        img (ndarray): The input image with or without the hands drawn
        '''

        #Turns the image into an RGB image and checks for hands
        imgRGB = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        self.results = self.hands.process(imgRGB)
        
        #Draws hand landmarks if draw is True and there are hands detected
        if self.results.multi_hand_landmarks:
            for handLms in self.results.multi_hand_landmarks:
                if draw:
                    self.mp_draw.draw_landmarks(img, handLms, self.mp_hands.HAND_CONNECTIONS)

        return img
    
    def find_position(self, img, draw=True):
        '''
        Returns the position of hand landmarks in the image and optionally returns draws the hand landmarks

        Parameters:
        img (ndarray): The input image where hands are detected
        draw (bool): Determines whether to draw the hand landmarks (True) or not (False)

        Returns:
        all_landmarks (list): A list of lists containing the id and coordiantes (x, y) of each hand landmark for each hand
        '''

        all_landmarks = []
        if not self.results.multi_hand_landmarks:
            return all_landmarks

        height, width = img.shape[0], img.shape[1]

        for hand_num, hand in enumerate(self.results.multi_hand_landmarks):
            landmark_list = []
            for id, landmark in enumerate(hand.landmark):
                center_x = int(landmark.x * width)
                center_y = int(landmark.y * height)
                landmark_list.append([id, center_x, center_y])
                if draw:
                    cv2.circle(img, (center_x, center_y), 5, (255, 255, 255), cv2.FILLED)

            label = "Right"
            if self.results.multi_handedness and hand_num < len(
                self.results.multi_handedness
            ):
                cls = self.results.multi_handedness[hand_num].classification
                if cls:
                    label = cls[0].label
            all_landmarks.append((label, landmark_list))

        return all_landmarks