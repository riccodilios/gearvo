import { z } from 'zod';

// Customer
export const customerSchema = z.object({
  fullName: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

// Vehicle
export const vehicleSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  licensePlate: z.string().optional(),
  vin: z.string().optional(),
  color: z.string().optional(),
  mileage: z.number().optional(),
});

// Supplier
export const supplierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
});

// Car Part
export const carPartSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  partNumber: z.string().optional(),
  supplierId: z.string().optional().nullable(),
  costPrice: z.number().min(0),
  retailPrice: z.number().min(0),
  stockQuantity: z.number().int().min(0),
  minStockLevel: z.number().int().min(0).default(5),
  category: z.string().optional(),
});

// Repair Order Part
export const repairOrderPartSchema = z.object({
  carPartId: z.string(),
  quantity: z.number().int().min(1),
  costPrice: z.number().min(0),
  retailPrice: z.number().min(0),
});

// Repair Order
export const repairOrderSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  vehicleId: z.string().min(1, 'Vehicle is required'),
  description: z.string().optional(),
  laborCost: z.number().min(0).default(0),
  parts: z.array(repairOrderPartSchema).min(1, 'At least one part is required'),
  notes: z.string().optional(),
});

// Payment
export const paymentSchema = z.object({
  invoiceId: z.string(),
  amount: z.number().min(0.01),
  method: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'CHECK', 'STRIPE', 'OTHER']),
  notes: z.string().optional(),
});

// Installment
export const installmentSchema = z.object({
  invoiceId: z.string(),
  amounts: z.array(z.number().min(0.01)),
  dueDates: z.array(z.coerce.date()),
});

export type CustomerInput = z.infer<typeof customerSchema>;
export type VehicleInput = z.infer<typeof vehicleSchema>;
export type SupplierInput = z.infer<typeof supplierSchema>;
export type CarPartInput = z.infer<typeof carPartSchema>;
export type RepairOrderInput = z.infer<typeof repairOrderSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type InstallmentInput = z.infer<typeof installmentSchema>;
