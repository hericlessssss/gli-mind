import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from '../pages/Dashboard';
import { GlucoseLog } from '../pages/GlucoseLog';
import { MealLog } from '../pages/MealLog';
import { Tips } from '../pages/Tips';
import { Auth } from '../pages/Auth';
import { PrivateRoute } from '../components/PrivateRoute';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/glucose"
        element={
          <PrivateRoute>
            <GlucoseLog />
          </PrivateRoute>
        }
      />
      <Route
        path="/meals"
        element={
          <PrivateRoute>
            <MealLog />
          </PrivateRoute>
        }
      />
      <Route
        path="/tips"
        element={
          <PrivateRoute>
            <Tips />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};