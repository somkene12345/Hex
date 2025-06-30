import React, {
    createContext,
    useContext,
    useState,
    ReactNode,
    useEffect,
  } from 'react';
  import AsyncStorage from '@react-native-async-storage/async-storage';
  
  const ThemeContext = createContext<{
    darkMode: boolean;
    toggleTheme: () => void;
  } | null>(null);
  
  export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [darkMode, setDarkMode] = useState(false);
  
    // Load theme from AsyncStorage on mount
    useEffect(() => {
      const loadTheme = async () => {
        try {
          const value = await AsyncStorage.getItem('darkMode');
          if (value !== null) {
            setDarkMode(JSON.parse(value));
          }
        } catch (e) {
          console.error('Failed to load theme:', e);
        }
      };
      loadTheme();
    }, []);
  
    const toggleTheme = async () => {
      try {
        const newValue = !darkMode;
        setDarkMode(newValue);
        await AsyncStorage.setItem('darkMode', JSON.stringify(newValue));
      } catch (e) {
        console.error('Failed to save theme:', e);
      }
    };
  
    return (
      <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
        {children}
      </ThemeContext.Provider>
    );
  };
  
  export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context)
      throw new Error('useTheme must be used inside ThemeProvider');
    return context;
  };
  