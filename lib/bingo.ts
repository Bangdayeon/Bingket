import { api } from './api';

export interface CreateBingoRequest {
  title: string;
  duration: string;
  startDate: string | null;
  endDate: string | null;
  grid: string;
  editCount: string;
  cells: string[];
}

export interface CreateBingoResponse {
  id: string;
}

export const createBingo = (data: CreateBingoRequest) =>
  api.post<CreateBingoResponse>('/bingos', data);
