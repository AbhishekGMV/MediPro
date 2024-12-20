import { Request, ParamsDictionary, Response } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { Status } from "../utils/status";
import prisma from "../config/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  patientLoginSchema,
  patientRegisterSchema,
} from "../schemas/patient.schema";

export const handlePatientRegister = async (
  req: Request<{}, any, any, ParsedQs, Record<string, any>>,
  res: Response<any, Record<string, any>, number>,
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
    console.log(err);
    return res.status(500).json({ status: Status.ERROR, message: err });
  }
};

export const updatePatientRegister = async (
  req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
  res: Response<any, Record<string, any>, number>,
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
  res: Response<any, Record<string, any>, number>,
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
    const isPasswordValid = await bcrypt.compare(password, patient.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ status: Status.FAILED, message: "Invalid credentials" });
    }
    const token = jwt.sign(
      { id: patient.id },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "1h",
      },
    );
    return res.status(200).json({
      status: Status.SUCCESS,
      message: "Login successful",
      data: { token, id: patient.id },
    });
  } catch (err) {
    return res.status(500).json({ status: Status.ERROR, message: err });
  }
};

export const getPatientsList = async (
  req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
  res: Response<any, Record<string, any>, number>,
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
export const getPatientWithID = async (
  req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
  res: Response<any, Record<string, any>, number>,
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
