import { Request, ParamsDictionary, Response } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { Status } from "../utils/status.js";
import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import {
  patientLoginSchema,
  patientRegisterSchema,
} from "../schemas/patient.js";
import logger from "../utils/logger.js";
import { issueAccessToken } from "../services/auth.js";
import { UserRole } from "../utils/constants.js";

export const handlePatientRegister = async (
  req: Request<{}, any, any, ParsedQs, Record<string, any>>,
  res: Response<any, Record<string, any>, number>
): Promise<any> => {
  const result = patientRegisterSchema.safeParse(req);
  if (!result.success) {
    return res
      .status(400)
      .json({ message: "Invalid request body", error: result });
  }
  const patient = req.body.user;

  try {
    const user = await prisma.patient.findUnique({
      where: { phone: req.body.user.phone },
    });
    if (user) {
      return res
        .status(400)
        .json({ status: Status.FAILED, message: "User already exists" });
    }
    patient.password = await bcrypt.hash(patient.password, 10);
    const response = await prisma.patient.create({ data: patient });
    return res.status(201).json({
      status: Status.SUCCESS,
      message: "Patient registered successfully",
      data: { ...response, password: undefined },
    });
  } catch (err) {
    logger.error({ message: "Failed to register patient", error: err });
    return res.status(500).json({ status: Status.ERROR, message: err });
  }
};

export const updatePatientRegister = async (
  req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
  res: Response<any, Record<string, any>, number>
): Promise<any> => {
  const { name, id, phone, gender, age } = req.body.user;
  const patient = {
    name,
    phone,
    age,
    gender: gender.toLowerCase(),
    id,
  };
  try {
    const result = await prisma.patient.update({
      where: {
        id,
      },
      data: {
        ...patient,
      },
    });
    return res
      .status(200)
      .json({ status: Status.SUCCESS, data: { id: patient.id } });
  } catch (err) {
    return res.status(500).json({ status: Status.ERROR, message: err });
  }
};

export const handlePatientLogin = async (
  req: Request<{}, any, any, ParsedQs, Record<string, any>>,
  res: Response<any, Record<string, any>, number>
): Promise<any> => {
  const result = patientLoginSchema.safeParse(req.body);
  if (!result.success) {
    return res
      .status(400)
      .json({ message: "Invalid request body", error: result.error });
  }
  const { phone, password } = req.body.user;

  try {
    const patient = await prisma.patient.findUnique({ where: { phone } });
    if (!patient) {
      return res
        .status(404)
        .json({ status: Status.FAILED, message: "User not found" });
    }
    const token = await issueAccessToken(
      {
        id: patient.id,
        passwordHash: patient.password,
        role: UserRole.PATIENT,
      },
      password
    );
    return res
      .cookie("token", token, {
        secure: true,
        sameSite: "none",
        path: "/",
      })
      .status(200)
      .json({
        status: Status.SUCCESS,
        message: "Login successful",
        data: { token },
      });
  } catch (err: any) {
    logger.error({
      message: "login failed",
      error: err.name,
      description: err.message,
      stack: err.stack,
    });
    return res.status(401).json({ status: Status.ERROR, message: err.message });
  }
};

export const getPatientsList = async (
  req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
  res: Response<any, Record<string, any>, number>
): Promise<any> => {
  try {
    return res.json({
      status: Status.SUCCESS,
      data: await prisma.patient.findMany({
        select: { id: true, name: true, phone: true },
      }),
    });
  } catch (err) {
    res.status(500).json({ status: Status.ERROR, message: err });
  }
};

/**
 * Get patient details by id
 * @param req
 * @param res
 * @returns
 * @name getPatientWithID
 * @description Get patient details by id
 */
export const getPatient = async (
  req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
  res: Response<any, Record<string, any>, number>
): Promise<any> => {
  const id = (req as any).user.id;
  try {
    const data = await prisma.patient.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
      },
    });
    return res.json({
      status: Status.SUCCESS,
      data: { ...data },
    });
  } catch (err) {
    res.status(500).json({ status: Status.ERROR, message: err });
  }
};

export const getPatientWithID = async (
  req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
  res: Response<any, Record<string, any>, number>
): Promise<any> => {
  const id = req.params.id;
  try {
    const data = await prisma.patient.findUnique({ where: { id } });
    return res.json({
      status: Status.SUCCESS,
      data: { ...data, password: undefined },
    });
  } catch (err) {
    res.status(500).json({ status: Status.ERROR, message: err });
  }
};
