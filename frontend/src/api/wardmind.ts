import { apiClient } from './client'
import type { DigitalTwinResponse, RoadClosureResponse } from '../types/api'

export const wardMindApi = {
  async getDigitalTwin(latitude: number, longitude: number, radius: number): Promise<DigitalTwinResponse> {
    const { data } = await apiClient.get<DigitalTwinResponse>('/digital-twin', {
      params: { latitude, longitude, radius },
    })
    return data
  },

  async simulateRoadClosure(
    latitude: number,
    longitude: number,
    radius: number,
    edgeId: string,
  ): Promise<RoadClosureResponse> {
    const { data } = await apiClient.post<RoadClosureResponse>('/simulate-road-closure', {
      latitude,
      longitude,
      radius,
      edge_id: edgeId,
    })
    return data
  },
}
