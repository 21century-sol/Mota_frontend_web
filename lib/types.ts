export interface ApiResponse<T> {
  statusCode: number;
  error: string | null;
  content: T;
}

export interface VehicleSummary {
  vehicleId: string;
  model: string | null;
  plateNumber: string;
  modelYear: number;
  vehicleType: string | null;
}

export interface TokenContext {
  rentalId: string;
  vehicle: VehicleSummary;
}

export interface Question {
  questionId: string;
  questionText: string;
  displayOrder: number;
  required: boolean;
}

export interface AnswerPayload {
  questionId: string;
  abnormal: boolean;
  text: string | null;
  photoFileIndexes: number[];
}

export interface SubmissionPayload {
  token: string;
  phoneNumber: string;
  termsOfServiceAgreed: boolean;
  privacyAgreed: boolean;
  reportSmsAgreed: boolean;
  marketingAgreed: boolean;
  answers: AnswerPayload[];
}

export interface SubmissionResult {
  submissionId: string;
  rentalId: string;
}
