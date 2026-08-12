import { Response } from "express";

type TMeta = {
  page: number;
  limit: number;
  total: number;
  unread_count?: number;
};

type TResponseData<T>={
    success: boolean;
    status: number;
    message: string;
    data: T;
    meta?: TMeta
}

export const sendResponse = <T>(res:Response, data:TResponseData<T>) => {
    res.status(data.status).json({
        success: data.success,
        status: data.status,
        message: data.message,
        data: data.data,
        meta: data.meta
    })
}