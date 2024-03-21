export function generateOTP(length = 6) {
    const chars = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += chars[Math.floor(Math.random() * chars.length)];
    }
    return otp;
}

export function validateOTP(otpObject) {
    // Compare the creation time with the current time
    const currentTime = new Date();
    const otpDate= new Date(otpObject)
    const elapsedTime = currentTime - otpDate;
    const expiryTime = 5 * 60 * 1000; // 5 minutes in milliseconds

    return Boolean(elapsedTime <= expiryTime);
}