const Header = () => {
  return (
    <header className="mb-6 text-center pt-2">
      <h1 className="text-4xl font-extrabold text-white drop-shadow-md animate-fade-in">
        📚 DocuSleuth
      </h1>

      <p className="text-lg text-white mt-2 opacity-90">
        A document AI assistant to ask questions based on your PDF content
      </p>

      <p className="text-md text-white mt-1 opacity-80">
        ⚠️ Only Digital PDFs are supported
      </p>
    </header>
  );
};

export default Header;
