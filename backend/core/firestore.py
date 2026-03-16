import os
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase on app startup
PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT")

def init_firebase():
    if not firebase_admin._apps:
        # If running locally, ADC should be sufficient if gcloud auth application-default login is run
        # Running on Cloud Run will automatically pick up the service account
        try:
            cred = credentials.ApplicationDefault()
            firebase_admin.initialize_app(cred, {
                'projectId': PROJECT_ID,
            })
            print("Firebase initialized with Application Default Credentials.")
        except Exception as e:
            print(f"Failed to initialize Firebase: {e}")

# Call init immediately
init_firebase()

def get_firestore_client():
    if not firebase_admin._apps:
        init_firebase()
    return firestore.client()

def save_session_metrics(user_id: str, session_data: dict):
    """
    Saves the session debrief metrics to Firestore.
    """
    db = get_firestore_client()
    try:
        collection_name = os.environ.get("FIRESTORE_COLLECTION", "sessions")
        # Add user_id to session data
        session_data["user_id"] = user_id
        
        doc_ref = db.collection(collection_name).document()
        doc_ref.set(session_data)
        return doc_ref.id
    except Exception as e:
        print(f"Error saving to Firestore: {e}")
        return None
