export interface IRegisterUser {
  name: string;
  email: string;
  password: string;
}

export interface ILoginUser {
  email: string;
  password: string;
}

export interface IGoogleLoginPayload {
  idToken: string;
}

export interface IJwtPayload {
  id: string;
  name: string | null;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: IJwtPayload;
    }
  }
}
