import { useState } from "react";

const CustomizeZoomButton = ({ zoomPluginInstance }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!zoomPluginInstance) return null;

  const { CurrentScale, ZoomIn, ZoomOut, Zoom } = zoomPluginInstance;

  // Predefined zoom levels
  const zoomLevels = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  return (
    <div className="relative">
      {/* Zoom Control Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        title="Zoom controls"
      >
        <svg 
          className="w-5 h-5 text-gray-600" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" 
          />
        </svg>
        <CurrentScale>
          {(props) => <span className="text-sm font-medium text-gray-700">{`${Math.round(props.scale * 100)}%`}</span>}
        </CurrentScale>
        <svg 
          className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20 min-w-[200px]">
            {/* Zoom In/Out Buttons */}
            <div className="flex items-center gap-2  border-gray-200">
              <ZoomOut>
                {(props) => (
                  <button
                    onClick={props.onClick}
                    className="flex-1 p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                    title="Zoom out"
                  >
                    <svg className="w-5 h-5 text-gray-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                    </svg>
                  </button>
                )}
              </ZoomOut>

              <CurrentScale>
                {(props) => (
                  <div className="px-3 py-2 bg-gray-50 rounded-lg text-center min-w-[60px]">
                    <span className="text-sm font-semibold text-gray-700">{`${Math.round(props.scale * 100)}%`}</span>
                  </div>
                )}
              </CurrentScale>

              <ZoomIn>
                {(props) => (
                  <button
                    onClick={props.onClick}
                    className="flex-1 p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                    title="Zoom in"
                  >
                    <svg className="w-5 h-5 text-gray-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                    </svg>
                  </button>
                )}
              </ZoomIn>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default CustomizeZoomButton;