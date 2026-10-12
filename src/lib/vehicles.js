// Valeur de ?vehicule= pour ouvrir le formulaire d'ajout
export const NEW_VEHICLE = 'nouveau'

// `capacity` compte le siège du chauffeur : il reste capacity - 1 places passagers
export function getPassengerSeats(vehicle) {
  return vehicle.capacity - 1
}

// « 9 places · 8 passagers + chauffeur »
export function formatVehicleCapacity(vehicle) {
  const seatCount = vehicle.capacity
  const passengerCount = getPassengerSeats(vehicle)
  return `${seatCount} place${seatCount > 1 ? 's' : ''} · ${passengerCount} passager${passengerCount > 1 ? 's' : ''} + chauffeur`
}

// Véhicules en service d'abord ; le tri est stable, l'ordre du backend est gardé dans chaque groupe
export function sortActiveFirst(vehicleList) {
  return [...vehicleList].sort((first, second) => Number(second.is_active) - Number(first.is_active))
}

// Valeurs de départ du formulaire : vides pour un ajout, celles du véhicule pour une modification
export function vehicleFormValues(vehicle) {
  return {
    licence_plate: vehicle?.licence_plate ?? '',
    capacity: vehicle ? String(vehicle.capacity) : '',
  }
}
