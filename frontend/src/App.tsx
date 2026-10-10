import { useState, useEffect } from 'react';
import './i18n';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './views/HomeScreen';
import { WeatherScreen } from './views/WeatherScreen';
import { SoilScreen } from './views/SoilScreen';
import { AskAgriScreen } from './views/AskAgriScreen';
import { MyFarmScreen } from './views/MyFarmScreen';
import { AlertsScreen } from './views/AlertsScreen';
import { ClimateMapScreen } from './views/ClimateMapScreen';
import { IrrigationScreen } from './views/IrrigationScreen';
import { CropRecommendationScreen } from './views/CropRecommendationScreen';
import { InsightsScreen } from './views/InsightsScreen';
import { SavedScreen } from './views/SavedScreen';
import { ProfileScreen } from './views/ProfileScreen';
import { LoginScreen } from './views/LoginScreen';
import { CropHealthScreen } from './views/CropHealthScreen';
import { FarmersMarketScreen } from './views/FarmersMarketScreen';
import { api } from './services/api';
import type { Farm } from './services/api';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  useEffect(() => {
    loadFarmsData();
  }, []);

  const loadFarmsData = async () => {
    try {
      const data = await api.getFarms();
      setFarms(data);
      if (data.length > 0) {
        setSelectedFarm(data[0]);
      }
    } catch (err) {
      console.error("Failed to load farms", err);
    }
  };

  const handleSelectFarm = (farm: Farm) => {
    setSelectedFarm(farm);
  };

  const handleDeleteFarm = async (id: number) => {
    try {
      await api.deleteFarm(id);
      const updated = farms.filter((f) => f.id !== id);
      setFarms(updated);
      if (selectedFarm?.id === id) {
        setSelectedFarm(updated[0] || null);
      }
    } catch (err) {
      console.error("Delete farm failed", err);
    }
  };

  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLoginComplete={(newFarms) => {
          setFarms(newFarms);
          if (newFarms.length > 0) setSelectedFarm(newFarms[0]);
          setIsAuthenticated(true);
          setCurrentTab('home');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF5] text-[#102D20] font-sans antialiased selection:bg-green-200">
      <Header
        onOpenNotifications={() => setCurrentTab('climate-alerts')}
        unreadAlertsCount={1}
      />

      <main className="max-w-md mx-auto min-h-[calc(100vh-120px)]">
        {currentTab === 'home' && (
          <HomeScreen
            onNavigate={(route) => setCurrentTab(route)}
            selectedFarm={selectedFarm}
          />
        )}

        {currentTab === 'weather' && (
          <WeatherScreen
            farms={farms}
            selectedFarm={selectedFarm}
            onSelectFarm={handleSelectFarm}
            onAddFarm={() => setCurrentTab('my-farm')}
            onBack={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'soil' && (
          <SoilScreen
            farms={farms}
            selectedFarm={selectedFarm}
            onSelectFarm={handleSelectFarm}
            onBack={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'ask-agri' && (
          <AskAgriScreen
            selectedFarm={selectedFarm}
            onBack={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'my-farm' && (
          <MyFarmScreen
            farms={farms}
            selectedFarm={selectedFarm}
            onSelectFarm={handleSelectFarm}
            onAddFarm={() => setIsAuthenticated(false)}
            onDeleteFarm={handleDeleteFarm}
          />
        )}

        {currentTab === 'climate-alerts' && (
          <AlertsScreen
            farms={farms}
            selectedFarm={selectedFarm}
            onSelectFarm={handleSelectFarm}
            onAddFarm={() => setCurrentTab('my-farm')}
            onBack={() => setCurrentTab('home')}
            onViewMap={() => setCurrentTab('climate-map')}
          />
        )}

        {currentTab === 'climate-map' && (
          <ClimateMapScreen
            farms={farms}
            selectedFarm={selectedFarm}
            onSelectFarm={handleSelectFarm}
            onBack={() => setCurrentTab('climate-alerts')}
          />
        )}

        {currentTab === 'irrigation' && (
          <IrrigationScreen
            farms={farms}
            selectedFarm={selectedFarm}
            onSelectFarm={handleSelectFarm}
            onBack={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'crop-recommendations' && (
          <CropRecommendationScreen
            farms={farms}
            selectedFarm={selectedFarm}
            onSelectFarm={handleSelectFarm}
            onAddFarm={() => setCurrentTab('my-farm')}
            onBack={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'farm-insights' && (
          <InsightsScreen farms={farms} onBack={() => setCurrentTab('home')} />
        )}

        {currentTab === 'saved' && <SavedScreen />}

        {currentTab === 'crop-health' && (
          <CropHealthScreen selectedFarm={selectedFarm} onBack={() => setCurrentTab('home')} />
        )}

        {currentTab === 'farmers-market' && (
          <FarmersMarketScreen selectedFarm={selectedFarm} onBack={() => setCurrentTab('home')} />
        )}

        {currentTab === 'profile' && (
          <ProfileScreen onLogout={() => setIsAuthenticated(false)} />
        )}
      </main>

      <BottomNav
        activeTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
      />
    </div>
  );
}

export default App;
