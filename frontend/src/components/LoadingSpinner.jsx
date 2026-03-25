import "../styles/LoadingSpinner.css";

function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="spinner-overlay">
      <div className="spinner-box">
        <div className="spinner-ring" />
        <p className="spinner-msg">{message}</p>
      </div>
    </div>
  );
}

export default LoadingSpinner;
