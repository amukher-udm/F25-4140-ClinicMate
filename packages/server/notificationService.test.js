import { sendAppointmentUpdate } from "./notificationService.js";
import nodemailer from "nodemailer";

jest.mock("nodemailer", () => {
  const internalMockSendMail = jest.fn().mockResolvedValue("Email sent");
  return {
    createTransport: jest.fn().mockReturnValue({
      sendMail: internalMockSendMail,
    }),
  };
});

describe("notificationService", () => {
  let consoleErrorSpy;
  let consoleWarnSpy;

  const mockSendMail = nodemailer.createTransport().sendMail;

  // Mock data for tests
  const mockUserEmail = "patient@example.com";
  const mockDetails = {
    date: "2024-07-01",
    time: "10:00 AM",
    hospitalName: "City Hospital",
    address: "123 Main St, Anytown, USA",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EMAIL_USER = "test@example.com";
    process.env.EMAIL_PASS = "secretpassword";

    // Spy on console to suppress output during tests
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console spies
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();

    // Clear environment variables
    delete process.env.EMAIL_USER;
    delete process.env.EMAIL_PASS;
  });

  // Successful email sending upon appointment creation
  test("sends email on appointment creation", async () => {
    await sendAppointmentUpdate(mockUserEmail, "created", mockDetails);
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "test@example.com",
        to: mockUserEmail,
        subject: "Appointment Created",
        text: expect.stringContaining(mockDetails.date),
      })
    );
  });

  // Successful email sending upon appointment cancellation
  test("sends email on appointment cancellation", async () => {
    await sendAppointmentUpdate(mockUserEmail, "cancelled", mockDetails);
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "test@example.com",
        to: mockUserEmail,
        subject: "Appointment Cancelled",
        text: expect.stringContaining(mockDetails.date),
      })
    );
  });

  // Successful email sending upon appointment reschedule
  test("sends email on appointment reschedule", async () => {
    await sendAppointmentUpdate(mockUserEmail, "rescheduled", mockDetails);
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "test@example.com",
        to: mockUserEmail,
        subject: "Appointment Rescheduled",
        text: expect.stringContaining(mockDetails.date),
      })
    );
  });

  // successful email sending upon appointment update with unknown type (default)
  test("sends email on appointment update with unknown type", async () => {
    await sendAppointmentUpdate(mockUserEmail, "updated", mockDetails);
    expect.objectContaining({
      from: "test@example.com",
      to: mockUserEmail,
      subject: "Appointment Update",
      text: expect.stringContaining("change to your appointment"),
    });
  });

  // not sending an email when credentials are missing
  test("does not send email if credentials are missing", async () => {
    delete process.env.EMAIL_USER;
    await sendAppointmentUpdate(mockUserEmail, "created", mockDetails);
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  test("logs error if sending fails", async () => {
    mockSendMail.mockRejectedValueOnce(new Error("SMTP down"));
    await sendAppointmentUpdate(mockUserEmail, "created", mockDetails);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error sending email:",
      expect.any(Error)
    );
  });

  // missing specific field
  test("handles missing date gracefully", async () => {
    const incompleteDetails = { time: "10:00 AM" };

    await sendAppointmentUpdate(mockUserEmail, "created", incompleteDetails);
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.not.stringContaining("undefined"),
      })
    );
  });

  // missing the details object
  test("does not crash if the details parameter is missing", async () => {
    await sendAppointmentUpdate(mockUserEmail, "cancelled", undefined);
    expect(mockSendMail).toHaveBeenCalled();
  });

  // missing the patient email
  test("does not attempt to send email if patient email is undefined", async () => {
    await sendAppointmentUpdate(undefined, "created", mockDetails);
    expect(mockSendMail).not.toHaveBeenCalled();
  });
});
