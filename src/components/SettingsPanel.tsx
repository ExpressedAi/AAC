@@ .. @@
 import React, { useState, useEffect } from 'react';
-import { Settings, Bot, Key, Save, Plus, Trash2, Zap, Globe, Code, FileText, BarChart3, Search, Terminal } from 'lucide-react';
+import { Settings, Bot, Key, Save, Plus, Trash2, Zap, Globe, Code, FileText, BarChart3, Search, Terminal, Download, Upload } from 'lucide-react';
-import { Agent } from '../types';
+import { Agent, AgentProfile } from '../types';
 import { agentCapabilitiesService } from '../services/agentCapabilities';
+import { dbService } from '../services/database';

@@ .. @@
   const refreshCapabilities = async () => {
     await loadAvailableCapabilities();
   };

+  const handleExportAgents = async () => {
+    try {
+      // Get learning data for the profile
+      const ratedMessages = await dbService.getRatedResponses();
+      const learningData = ratedMessages.length > 0 ? {
+        totalRatings: ratedMessages.length,
+        averageRating: ratedMessages.reduce((sum, msg) => sum + (msg.rating || 0), 0) / ratedMessages.length,
+        improvementRate: 0 // Could calculate this based on trends
+      } : undefined;
+
+      const profile: AgentProfile = {
+        agents,
+        exportDate: new Date(),
+        version: '1.0',
+        learningData
+      };
+
+      const blob = new Blob([JSON.stringify(profile, null, 2)], {
+        type: 'application/json'
+      });
+      const url = URL.createObjectURL(blob);
+      const a = document.createElement('a');
+      a.href = url;
+      a.download = `agent-profile-${new Date().toISOString().split('T')[0]}.json`;
+      document.body.appendChild(a);
+      a.click();
+      document.body.removeChild(a);
+      URL.revokeObjectURL(url);
+    } catch (error) {
+      console.error('Error exporting agents:', error);
+      alert('Failed to export agent profile');
+    }
+  };

+  const handleImportAgents = (e: React.ChangeEvent<HTMLInputElement>) => {
+    const file = e.target.files?.[0];
+    if (!file) return;

+    const reader = new FileReader();
+    reader.onload = (event) => {
+      try {
+        const content = event.target?.result as string;
+        const profile: AgentProfile = JSON.parse(content);
+        
+        if (!profile.agents || !Array.isArray(profile.agents)) {
+          alert('Invalid agent profile format');
+          return;
+        }

+        const confirmMessage = `This will replace all current agents with ${profile.agents.length} agents from the profile. Continue?`;
+        if (confirm(confirmMessage)) {
+          saveAgents(profile.agents);
+          alert(`Successfully imported ${profile.agents.length} agents!`);
+        }
+      } catch (error) {
+        console.error('Error importing agents:', error);
+        alert('Failed to import agent profile. Please check the file format.');
+      }
+    };
+    reader.readAsText(file);
+    e.target.value = ''; // Reset input
+  };

   const groupCapabilities = () => {
@@ .. @@
       <div className="p-4 border-b border-blue-200 bg-blue-50">
         <div className="flex items-center justify-between mb-4">
           <h2 className="text-lg font-semibold text-blue-800 flex items-center">
             <Settings size={20} className="mr-2" />
             Agent Settings
           </h2>
-          <button
-            onClick={handleCreateAgent}
-            className="flex items-center space-x-2 px-3 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm shadow-md"
-          >
-            <Plus size={16} />
-            <span>New Agent</span>
-          </button>
+          <div className="flex items-center space-x-2">
+            <button
+              onClick={handleExportAgents}
+              className="flex items-center space-x-2 px-3 py-2 bg-green-400 text-white rounded-lg hover:bg-green-500 transition-colors text-sm shadow-md"
+              disabled={agents.length === 0}
+            >
+              <Download size={16} />
+              <span>Export Profile</span>
+            </button>
+            <label className="cursor-pointer flex items-center space-x-2 px-3 py-2 bg-cyan-400 text-white rounded-lg hover:bg-cyan-500 transition-colors text-sm shadow-md">
+              <Upload size={16} />
+              <s
  }pan>Import Profile</span>
+              <input
+                type="file"
+                accept=".json"
+                onChange={handleImportAgents}
+                className="hidden"
+              />
+            </label>
+            <button
+              onClick={handleCreateAgent}
+              className="flex items-center space-x-2 px-3 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm shadow-md"
+            >
+              <Plus size={16} />
+              <span>New Agent</span>
+            </button>
+          </div>
         </div>
       </div>

@@ .. @@