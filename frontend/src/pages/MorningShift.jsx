import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import morningBanner from "../assets/Morning.png";
import "../styles/MorningShift.css";

// Route pickup locations from original src.zip
const pickups = {
  Biratnagar: [
    "Koshi Project", "Roadcess", "Bus Park", "Mahendra Chowk", "Bhrikuti Chowk",
    "Bargachi", "Kanchanbari", "Oil Nigam", "Birat Health", "Tanki Sinwari", "Nemuwa",
    "NIC Asia Duhabi", "Duhabi", "Sonapur", "Kadamgacchi", "Khanar", "Reliance",
    "Sathi Petrol Pump", "Nabil Bank"
  ],
  Damak: [
    "Kerkha", "Sitapuri", "Padajungi", "Damak Chowk", "Urlabari", "Aitabare",
    "Mangalbare", "Pathari", "Kanepokhari", "Bhaunne", "Laxmi Marga", "Betana", "Belbari",
    "Lalbhitti", "Khorsane", "BiratChowk", "Salakpur", "Gothgaun"
  ],
  Dharan: [
    "BPKIHS", "Railway Chowk", "Mangalbare", "Kalyan Chowk", "Sami Chowk",
    "Amarhat", "Bhanu Chowk", "Bargachi", "Langali Chowk",
    "Tarahara", "Pipal Chowk", "Itahari Chowk"
  ],
  Inaruwa: [
    "Madhesha", "Jhakan Jhora", "Balaha", "Gol Chowk", "Mahendra Chowk",
    "Haleshi Chowk", "Titriban Chowk", "Jhumka", "Kanchi Chowk", "Bhatbhateni",
    "Balgram", "Pachrukhi", "Kalanki Chowk", "Paragati Chowk", "Itahari Chowk"
  ],
};

const pickupTimes = {
  Biratnagar: {
    "Koshi Project": "6:45 AM", "Roadcess": "6:47 AM", "Bus Park": "6:48 AM",
    "Mahendra Chowk": "6:50 AM", "Bhrikuti Chowk": "6:52 AM", "Bargachi": "6:55 AM",
    "Kanchanbari": "7:00 AM", "Oil Nigam": "7:01 AM", "Birat Health": "7:05 AM",
    "Tanki Sinwari": "7:08 AM", "Nemuwa": "7:12 AM", "NIC Asia Duhabi": "7:15 AM",
    "Duhabi": "7:18 AM", "Sonapur": "7:22 AM", "Kadamgacchi": "7:23 AM",
    "Khanar": "7:25 AM", "Reliance": "7:26 AM", "Sathi Petrol Pump": "7:32 AM", "Nabil Bank": "7:35 AM"
  },
  Damak: {
    "Kerkha": "6:00 AM", "Sitapuri": "6:05 AM", "Padajungi": "6:10 AM",
    "Damak Chowk": "6:20 AM", "Urlabari": "6:25 AM", "Aitabare": "6:30 AM",
    "Mangalbare": "6:35 AM", "Pathari": "6:45 AM", "Kanepokhari": "6:55 AM",
    "Bhaunne": "7:00 AM", "Laxmi Marga": "7:05 AM", "Betana": "7:10 AM",
    "Belbari": "7:15 AM", "Lalbhitti": "7:20 AM", "Khorsane": "7:25 AM",
    "BiratChowk": "7:30 AM", "Salakpur": "7:35 AM", "Gothgaun": "7:40 AM"
  },
  Dharan: {
    "BPKIHS": "6:40 AM", "Railway Chowk": "6:48 AM", "Mangalbare": "6:53 AM",
    "Kalyan Chowk": "6:55 AM", "Sami Chowk": "6:58 AM", "Amarhat": "7:00 AM",
    "Bhanu Chowk": "7:05 AM", "Bargachi": "7:10 AM", "Langali Chowk": "7:15 AM",
    "Tarahara": "7:30 AM", "Pipal Chowk": "7:35 AM", "Itahari Chowk": "7:40 AM"
  },
  Inaruwa: {
    "Madhesha": "6:30 AM", "Jhakan Jhora": "6:45 AM", "Balaha": "6:50 AM",
    "Gol Chowk": "7:00 AM", "Mahendra Chowk": "7:02 AM", "Haleshi Chowk": "7:10 AM",
    "Titriban Chowk": "7:15 AM", "Jhumka": "7:20 AM", "Kanchi Chowk": "7:25 AM",
    "Bhatbhateni": "7:27 AM", "Balgram": "7:30 AM", "Pachrukhi": "7:32 AM",
    "Kalanki Chowk": "7:35 AM", "Paragati Chowk": "7:38 AM", "Itahari Chowk": "7:40 AM"
  },
};

// Map coordinates for each route
const mapCoords = {
  Biratnagar: { center: [26.4525, 87.2718], zoom: 11 },
  Damak:      { center: [26.6614, 87.6967], zoom: 11 },
  Dharan:     { center: [26.8065, 87.2841], zoom: 11 },
  Inaruwa:    { center: [26.5619, 87.1444], zoom: 11 },
};

function MorningShift() {
  const [route, setRoute] = useState("");
  const [pickup, setPickup] = useState("");
  const [activeTab, setActiveTab] = useState("schedule");
  const navigate = useNavigate();

  const handleProceedToPayment = () => {
    if (!route || !pickup) {
      alert("Please select both route and bus stop!");
      return;
    }
    const time = pickupTimes[route][pickup];
    navigate("/payment", {
      state: { shift: "morning", route, busStop: pickup, pickupTime: time }
    });
  };

  // OpenStreetMap embed — no API key required
  const mapUrl = route
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${mapCoords[route]?.center[1] - 0.3},${mapCoords[route]?.center[0] - 0.2},${mapCoords[route]?.center[1] + 0.3},${mapCoords[route]?.center[0] + 0.2}&layer=mapnik&marker=${mapCoords[route]?.center[0]},${mapCoords[route]?.center[1]}`
    : null;

  return (
    <div className="shift-page">
      <Navbar />

      <div className="shift-banner">
        <img src={morningBanner} alt="Morning Shift" className="shift-banner-img" />
        <div className="shift-banner-overlay">
          <span className="shift-label morning-label">Morning Shift</span>
          <h1>IIC Morning Bus Schedule</h1>
          <p>Departure from IIC: <strong>6:00 AM</strong> — Select your route below</p>
        </div>
      </div>

      <div className="shift-container">
        {/* Tabs */}
        <div className="shift-tabs">
          <button className={activeTab === "schedule" ? "tab active" : "tab"} onClick={() => setActiveTab("schedule")}>Schedule & Register</button>
          <button className={activeTab === "map" ? "tab active" : "tab"} onClick={() => setActiveTab("map")}>Route Map</button>
          <button className={activeTab === "info" ? "tab active" : "tab"} onClick={() => setActiveTab("info")}>Route Info</button>
        </div>

        {activeTab === "schedule" && (
          <div className="shift-content">
            <div className="form-panel">
              <h2>Select Your Route & Stop</h2>
              <p className="form-hint">Choose a route and bus stop to view pickup time. Complete registration via the payment page.</p>

              <div className="form-field">
                <label>Route</label>
                <select value={route} onChange={(e) => { setRoute(e.target.value); setPickup(""); }}>
                  <option value="">— Select Route —</option>
                  <option>Biratnagar</option>
                  <option>Damak</option>
                  <option>Dharan</option>
                  <option>Inaruwa</option>
                </select>
              </div>

              <div className="form-field">
                <label>Bus Stop</label>
                <select value={pickup} onChange={(e) => setPickup(e.target.value)} disabled={!route}>
                  <option value="">— Select Bus Stop —</option>
                  {route && pickups[route].map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {route && pickup && (
                <div className="pickup-info">
                  <div className="pickup-row">
                    <span className="pickup-label">Stop</span>
                    <span className="pickup-value">{pickup}</span>
                  </div>
                  <div className="pickup-row">
                    <span className="pickup-label">Time</span>
                    <span className="pickup-value time-highlight">{pickupTimes[route][pickup]}</span>
                  </div>
                  <div className="pickup-row">
                    <span className="pickup-label">Route</span>
                    <span className="pickup-value">{route} → IIC Itahari</span>
                  </div>
                </div>
              )}

              <button className="proceed-btn" onClick={handleProceedToPayment}>
                Proceed to Payment & Register
              </button>
            </div>

            {/* Schedule Table */}
            {route && (
              <div className="schedule-table-panel">
                <h3>{route} Route — All Stops</h3>
                <table className="schedule-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Bus Stop</th>
                      <th>Pickup Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pickups[route].map((stop, i) => (
                      <tr key={stop} className={stop === pickup ? "highlighted-row" : ""}>
                        <td>{i + 1}</td>
                        <td>{stop}</td>
                        <td className="time-cell">{pickupTimes[route][stop]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "map" && (
          <div className="map-panel">
            <div className="map-select-bar">
              <label>Select Route to View Map:</label>
              <select value={route} onChange={(e) => setRoute(e.target.value)}>
                <option value="">— Select Route —</option>
                <option>Biratnagar</option>
                <option>Damak</option>
                <option>Dharan</option>
                <option>Inaruwa</option>
              </select>
            </div>
            {route && mapUrl ? (
              <div className="map-frame-wrap">
                <div className="map-label">{route} Route — Live Map</div>
                <iframe
                  title={`${route} Map`}
                  src={mapUrl}
                  className="map-iframe"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="map-placeholder">
                <span>No route selected</span>
                <p>Select a route to view its map</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "info" && (
          <div className="info-panel">
            <h2>Route Information</h2>
            <div className="info-grid">
              {Object.entries(pickups).map(([r, stops]) => (
                <div className="info-card" key={r}>
                  <h3>{r}</h3>
                  <p className="info-stops">{stops.length} Stops</p>
                  <ul>
                    {stops.slice(0, 5).map(s => <li key={s}>{s}</li>)}
                    {stops.length > 5 && <li className="more-stops">+{stops.length - 5} more stops...</li>}
                  </ul>
                </div>
              ))}
            </div>

            <div className="info-rules">
              <h3>Bus Rules & Guidelines</h3>
              <ul>
                <li>Students must present their bus pass / payment receipt at entry</li>
                <li>Be at the bus stop at least 5 minutes before scheduled pickup time</li>
                <li>Bus will not wait more than 2 minutes at any stop</li>
                <li>Payment must be completed each semester to use the bus service</li>
                <li>Contact admin for route changes or complaints</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MorningShift;
