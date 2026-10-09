from fastapi import APIRouter, HTTPException, Query
from ..services.location_service import location_service
from ..schemas import PincodeResponse, ReverseGeocodeResponse

router = APIRouter(prefix="/api/location", tags=["Location"])

@router.get("/pincode/{pincode}", response_model=PincodeResponse)
async def lookup_pincode(pincode: str):
    if len(pincode) != 6 or not pincode.isdigit():
        raise HTTPException(status_code=400, detail="Invalid 6-digit Indian PIN code format")
    result = await location_service.lookup_pincode(pincode)
    return result

@router.get("/reverse-geocode", response_model=ReverseGeocodeResponse)
async def reverse_geocode(lat: float = Query(...), lon: float = Query(...)):
    result = await location_service.reverse_geocode(lat, lon)
    return result
