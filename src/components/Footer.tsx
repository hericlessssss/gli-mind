import React from 'react';

export const Footer = () => {
  return (
    <footer className="w-full bg-dark-200/80 backdrop-blur-lg border-t border-dark-300">
      <div className="container mx-auto px-4 py-4">
        <div className="text-center text-sm text-gray-400">
          <a 
            href="https://labora-tech.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-primary-400 transition-colors"
          >
            Desenvolvido por Labora Tech
          </a>
        </div>
      </div>
    </footer>
  );
};