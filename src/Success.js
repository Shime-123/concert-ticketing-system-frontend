import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

function Success() {
  const { width, height } = useWindowSize();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-green-100 dark:bg-green-900 text-gray-900 dark:text-white">
      <Confetti width={width} height={height} />
      <h1 className="text-4xl font-bold mb-4">Payment Successful! 🎉</h1>
      <p className="text-xl">Thank you for buying your ticket. Enjoy the concert!</p>
    </div>
  );
}

export default Success;
