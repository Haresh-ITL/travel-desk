export interface User {
  uuid: string;
  name: string;
  email: string;
  role: string;
  managers?: string[]; // for employees
  status?: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  role: string;
}

export interface AssignManagersRequest {
  managerUuids: string[];
}
