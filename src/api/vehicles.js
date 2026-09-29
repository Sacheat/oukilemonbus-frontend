import { api } from "./client"

export async function getVehicles ( params = {}, { signal } = {}) {
    const { data } = await api.get('/vehicles', {params,signal})
    return data
}
