import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendAppointmentUpdate = async (userEmail, type, details) => {
  let subject = "";
  let text = "";
  const locationInfo = details.hospitalName
    ? `\nLocation:\n ${details.hospitalName}\n${details.address}`
    : "";
  switch (type) {
    case "created":
      subject = "Appointment Created";
      text =
        `Your appointment has been scheduled for ${details.date} at ${details.time}.` +
        locationInfo;
      break;
    case "cancelled":
      subject = "Appointment Cancelled";
      text =
        `Your appointment on ${details.date} at ${details.time} has been cancelled.` +
        locationInfo;
      break;
    case "rescheduled":
      subject = "Appointment Rescheduled";
      text =
        `Your appointment has been rescheduled to ${details.date} at ${details.time}.` +
        locationInfo;
      break;
    default:
      subject = "Appointment Update";
      text =
        "There has been a change to your appointment. Please check your account for details." +
        locationInfo;
  }
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: subject,
      text: text,
    });
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
