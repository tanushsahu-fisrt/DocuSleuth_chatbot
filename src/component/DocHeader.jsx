const DocHeader = ({ 
  searchKeyword, 
  setSearchKeyword, 
  handleKeyPress, 
  handleClearSearch, 
  handleSearch, 
  CurrentPageLabel, 
  SwitchThemeButton, 
  zoomPluginInstance, 
  jumpToPreviousMatch, 
  jumpToNextMatch, 
  highlights, 
  setHighlights 
}) => {
    return (
      <div className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-md">
        <div className="flex items-center gap-4 px-6 py-3">

          {/* App Name */}
          <h1 className="text-xl font-bold text-purple-700 whitespace-nowrap">
            📚 DocuSleuth
          </h1>

          {/* Page Indicator */}
          <CurrentPageLabel>
            {(props) => (
              <span className="text-sm  font-bold text-gray-700">
                {`${props.currentPage + 1} / ${props.numberOfPages}`}
              </span>
            )}
          </CurrentPageLabel>

          <SwitchThemeButton />

          {/* Search Box */}
          <div className="flex-1 flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 bg-white">

            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search in document..."
              className="flex-1 outline-none text-gray-700 bg-transparent"
            />

            {searchKeyword && (
              <button
                onClick={handleClearSearch}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={handleSearch}
            disabled={!searchKeyword.trim()}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 transition"
          >
            Search
          </button>

          <CustomizeZoomButton zoomPluginInstance={zoomPluginInstance} />

          {/* Match navigation */}
          <div className="flex gap-2">
            <button
              onClick={jumpToPreviousMatch}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              <FaChevronLeft />
            </button>
            <button
              onClick={jumpToNextMatch}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              <FaChevronRight />
            </button>
          </div>

          {highlights.length > 0 && (
            <button
              onClick={() => setHighlights([])}
              className="bg-red-500 text-white px-3 py-2 rounded-lg text-sm"
            >
              Clear ({highlights.length})
            </button>
          )}
        </div>
      </div>
    );
  };

  export default DocHeader;