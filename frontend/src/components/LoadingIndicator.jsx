// import "../styles/LoadingIndicator.css";

// const LoadingIndicator = () => {
//   return (
//     <div className="loading-container">
//       <div className="loader"></div>
//     </div>
//   );
// };

// export default LoadingIndicator;

import "../styles/LoadingIndicator.css";

const LoadingIndicator = () => {
  return (
    <div className="loading-container">
      <div className="loader"></div>
      <p className="text-blue-500 mt-4">Loading...</p>
    </div>
  );
};

export default LoadingIndicator;