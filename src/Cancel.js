function Cancel() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-red-100 dark:bg-red-900 text-gray-900 dark:text-white">
      <h1 className="text-4xl font-bold mb-4">Payment Cancelled ❌</h1>
      <p className="text-xl">Your ticket purchase was cancelled.</p>
    </div>
  );
}

export default Cancel;
