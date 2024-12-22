import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  fetchShoppingList,
  addItem,
  deleteItem,
  toggleItemStatus,
  addMember,
  removeMember,
  leaveList,
} from "../api";
import { useUser } from "./UserSwitcher"; // Kontext uživatele
import { useLanguage } from "./LanguageContext"; // Kontext pro jazyk
import { useTheme } from "./ThemeContext"; // Kontext pro téma
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import "./ShoppingListDetail.css";

const ShoppingListDetail = () => {
  const { id } = useParams();
  const [shoppingList, setShoppingList] = useState(null);
  const [newItem, setNewItem] = useState("");
  const [newMemberId, setNewMemberId] = useState("");
  const { currentUser } = useUser();
  const { language, translations } = useLanguage();
  const { theme } = useTheme(); // Přidáno pro správu světlého/tmavého režimu

  useEffect(() => {
    const loadShoppingList = async () => {
      try {
        const response = await fetchShoppingList(id, currentUser.id);
        setShoppingList({
          id: response.data.shoppingList._id,
          ...response.data.shoppingList,
        });
      } catch (error) {
        console.error("Failed to fetch shopping list:", error);
      }
    };

    if (id && currentUser) {
      loadShoppingList();
    }
  }, [id, currentUser]);

  const handleAddItem = async () => {
    if (!newItem.trim()) return;

    try {
      const response = await addItem(id, newItem, 1, currentUser.id);
      setShoppingList((prev) => ({
        ...prev,
        items: [
          ...prev.items,
          { id: response.data.itemId, name: newItem, purchased: false },
        ],
      }));
      setNewItem("");
    } catch (error) {
      console.error("Failed to add item", error);
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await deleteItem(id, itemId, currentUser.id);
      setShoppingList((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item._id !== itemId),
      }));
    } catch (error) {
      console.error("Failed to delete item", error);
    }
  };

  const handleToggleItem = async (itemId, newStatus) => {
    try {
      await toggleItemStatus(id, itemId, newStatus, currentUser.id);
      setShoppingList((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item._id === itemId ? { ...item, purchased: newStatus } : item
        ),
      }));
    } catch (error) {
      console.error("Failed to toggle item status", error);
    }
  };

  if (!shoppingList) return <div>{translations[language].loading}</div>;

  // Data pro koláčový graf
  const solvedCount = shoppingList.items.filter((item) => item.purchased).length;
  const unsolvedCount = shoppingList.items.length - solvedCount;

  const pieData = [
    { name: translations[language].solved, value: solvedCount },
    { name: translations[language].unsolved, value: unsolvedCount },
  ];

  const COLORS = theme === "dark" ? ["#66bb6a", "#ff6f61"] : ["#82ca9d", "#ff9f87"];

  return (
    <div className={`shopping-list-detail ${theme}`}>
      <h1>{shoppingList.title}</h1>

      {/* Koláčový graf */}
      <div className="chart-container">
        <h2>{translations[language].chartTitle}</h2>
        <PieChart width={400} height={400}>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            outerRadius={150}
            fill="#8884d8"
            dataKey="value"
            label
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </div>

      {/* Items Section */}
      <div className="items-section">
        <h2>{translations[language].items}</h2>
        <ul className="items-list">
          {shoppingList.items.map((item) => (
            <li key={item._id} className="item-row">
              <span>{item.name}</span>
              <input
                type="checkbox"
                checked={item.purchased}
                onChange={() => handleToggleItem(item._id, !item.purchased)}
              />
              <button onClick={() => handleDeleteItem(item._id)}>
                {translations[language].delete}
              </button>
            </li>
          ))}
        </ul>

        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder={translations[language].addItemPlaceholder}
        />
        <button onClick={handleAddItem}>{translations[language].addItem}</button>
      </div>
    </div>
  );
};

export default ShoppingListDetail;
