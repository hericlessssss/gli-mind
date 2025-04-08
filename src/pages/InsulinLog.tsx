import React from 'react';
import { GlucoseInsulinForm } from '../components/GlucoseInsulinForm';

export const InsulinLog = () => {
  return (
    <div className="space-y-4 pb-20">
      <h1 className="text-2xl font-bold">Registro de Insulina</h1>
      <div className="p-4 bg-gray-900 rounded-lg">
        <GlucoseInsulinForm type="insulin" />
      </div>
    </div>
  );
};