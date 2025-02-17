export const LoadingState = () => (
  <div className="flex flex-1 justify-center items-center h-full">
    <div className="w-8 h-8 border-4 border-sunset border-t-transparent rounded-full animate-spin" />
  </div>
);

export const EmptyState = ({ message = 'No data available' }) => (
  <div className="flex flex-1 justify-center items-center h-full px-4 text-center">
    <p className="text-gray-500">{message}</p>
  </div>
);
