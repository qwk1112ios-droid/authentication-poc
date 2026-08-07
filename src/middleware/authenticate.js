import "dotenv/config";
import jwt from "jsonwebtoken";

export function authenticate(request, response, next) {
  const authorizationHeader = request.headers.authorization;

  if (!authorizationHeader) {
    return response.status(401).json({
      error: "Authentication required"
    });
  }

  if (!authorizationHeader.startsWith("Bearer ")) {
    return response.status(401).json({
      error: "Invalid authorization header"
    });
  }

  const token = authorizationHeader.substring(7);

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET,
      {
        issuer: "authentication-poc",
        audience: "authentication-poc-api"
      }
    );

    request.user = payload;

    next();
  } catch (error) {
    return response.status(401).json({
      error: "Invalid or expired token"
    });
  }
}