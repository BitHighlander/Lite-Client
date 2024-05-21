import React, { useEffect, useState } from 'react';
import Styled from 'styled-components';
const { ipcRenderer } = require('electron');

const SettingsView = (): JSX.Element => {
  const [currentModel, setCurrentModel] = useState<string>('default');
  const [installedModels, setInstalledModels] = useState<string[]>([]);

  useEffect(() => {
    const fetchModels = async () => {
      const models = await ipcRenderer.invoke('OllamaGetAllModels');
      setInstalledModels(models);
      const current = await ipcRenderer.invoke('GetCurrentModel');
      setCurrentModel(current);
    };
    fetchModels();
  }, []);

  const handleModalChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = event.target.value;
    setCurrentModel(newModel);
    await ipcRenderer.invoke('SetCurrentModel', newModel);
  };

  return (
    <Settings.Layout>
      <Settings.Title>Under Construction - Preview Alpha Build</Settings.Title>
      <Settings.Row>
        <Settings.Label>Current Modal Selected:</Settings.Label>
        <Settings.Value>{currentModel}</Settings.Value>
      </Settings.Row>
      <Settings.Row>
        <Settings.Label>Select Model:</Settings.Label>
        <Settings.Select onChange={handleModalChange} value={currentModel}>
          {installedModels.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </Settings.Select>
      </Settings.Row>
    </Settings.Layout>
  );
};

const Settings = {
  Layout: Styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    align-items: center;
    justify-content: center;
  `,
  Title: Styled.h2`
    display: flex;
    font-family: ${(props) => props.theme.fonts.family.primary.bold};
    font-size: ${(props) => props.theme.fonts.size.medium};
    color: ${(props) => props.theme.colors.notice};
    margin-bottom: 20px;
  `,
  Row: Styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 10px;
  `,
  Label: Styled.label`
    display: flex;
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    font-size: ${(props) => props.theme.fonts.size.small};
    color: ${(props) => props.theme.colors.balance};
    margin-right: 10px;
  `,
  Value: Styled.span`
    display: flex;
    font-family: ${(props) => props.theme.fonts.family.secondary.bold};
    font-size: ${(props) => props.theme.fonts.size.small};
    color: ${(props) => props.theme.colors.notice};
  `,
  Select: Styled.select`
    display: flex;
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    font-size: ${(props) => props.theme.fonts.size.small};
    color: ${(props) => props.theme.colors.notice};
  `,
};

export default SettingsView;
