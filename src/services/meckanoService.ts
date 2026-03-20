export const getDailyAttendance = async () => {
  const apiKey = process.env.MECKANO_API_KEY;
  try {
    const response = await fetch(`https://api.meckano.co.il/v1/attendance?api_key=${apiKey}`);
    return await response.json();
  } catch (error) {
    console.error("Meckano Sync Error:", error);
    return null;
  }
};
