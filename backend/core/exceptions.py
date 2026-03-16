from fastapi import HTTPException, status


class ScenarioNotFoundException(HTTPException):
    def __init__(self, scenario_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario '{scenario_id}' not found"
        )


class SessionNotFoundException(HTTPException):
    def __init__(self, session_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found"
        )


class SessionAlreadyActiveException(HTTPException):
    def __init__(self, session_id: str):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Session '{session_id}' is already active"
        )


class GeminiConnectionException(HTTPException):
    def __init__(self, detail: str = "Failed to connect to Gemini Live API"):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=detail
        )


class FirestoreException(HTTPException):
    def __init__(self, detail: str = "Database operation failed"):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail
        )