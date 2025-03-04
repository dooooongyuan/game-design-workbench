import React, { useState, useEffect } from 'react';
import './FormulaEditor.css';
import { evaluate } from 'mathjs';

// 定义公式类型
interface Formula {
  id: string;
  name: string;
  expression: string;
  description: string;
  variables: Variable[];
  lastModified: number;
}

// 定义变量类型
interface Variable {
  id: string;
  name: string;
  defaultValue: number;
  minValue?: number;
  maxValue?: number;
  step?: number;
  description?: string;
}

interface FormulaEditorProps {
  formula: Formula | null;
  onUpdateFormula: (updatedFormula: Partial<Formula>) => void;
  onAddVariable: (formulaId: string) => void;
  onRemoveVariable: (formulaId: string, variableId: string) => void;
  onUpdateVariable: (formulaId: string, variableId: string, updates: Partial<Variable>) => void;
  onTestFormula: (formula: Formula) => void;
}

const FormulaEditor: React.FC<FormulaEditorProps> = ({
  formula,
  onUpdateFormula,
  onAddVariable,
  onRemoveVariable,
  onUpdateVariable,
  onTestFormula
}) => {
  const [testValues, setTestValues] = useState<Record<string, number>>({});
  const [testResult, setTestResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 当公式变化时，重置测试值
  useEffect(() => {
    if (formula) {
      const initialValues: Record<string, number> = {};
      formula.variables.forEach(variable => {
        initialValues[variable.name] = variable.defaultValue;
      });
      setTestValues(initialValues);
      setTestResult(null);
      setError(null);
    }
  }, [formula]);

  if (!formula) {
    return <div className="formula-editor-empty">请选择或创建一个公式</div>;
  }

  // 处理公式名称变更
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateFormula({ name: e.target.value });
  };

  // 处理公式表达式变更
  const handleExpressionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateFormula({ expression: e.target.value });
  };

  // 处理公式描述变更
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateFormula({ description: e.target.value });
  };

  // 处理添加变量
  const handleAddVariable = () => {
    onAddVariable(formula.id);
  };

  // 处理变量名称变更
  const handleVariableNameChange = (variableId: string, name: string) => {
    onUpdateVariable(formula.id, variableId, { name });
  };

  // 处理变量默认值变更
  const handleVariableDefaultValueChange = (variableId: string, value: number) => {
    onUpdateVariable(formula.id, variableId, { defaultValue: value });
  };

  // 处理变量最小值变更
  const handleVariableMinValueChange = (variableId: string, value: number) => {
    onUpdateVariable(formula.id, variableId, { minValue: value });
  };

  // 处理变量最大值变更
  const handleVariableMaxValueChange = (variableId: string, value: number) => {
    onUpdateVariable(formula.id, variableId, { maxValue: value });
  };

  // 处理变量步长变更
  const handleVariableStepChange = (variableId: string, value: number) => {
    onUpdateVariable(formula.id, variableId, { step: value });
  };

  // 处理变量描述变更
  const handleVariableDescriptionChange = (variableId: string, description: string) => {
    onUpdateVariable(formula.id, variableId, { description });
  };

  // 处理测试值变更
  const handleTestValueChange = (variableName: string, value: number) => {
    setTestValues(prev => ({
      ...prev,
      [variableName]: value
    }));
  };

  // 测试公式
  const handleTestFormula = () => {
    try {
      // 使用 mathjs 计算公式结果
      const result = evaluate(formula.expression, testValues);
      setTestResult(result);
      setError(null);
    } catch (err) {
      setTestResult(null);
      setError(`计算错误: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="formula-editor">
      <div className="formula-header">
        <div className="form-group">
          <label>公式名称</label>
          <input
            type="text"
            value={formula.name}
            onChange={handleNameChange}
            placeholder="输入公式名称"
          />
        </div>
      </div>

      <div className="formula-body">
        <div className="form-group">
          <label>公式表达式</label>
          <textarea
            value={formula.expression}
            onChange={handleExpressionChange}
            placeholder="例如: damage = attack * (1 - defense/100)"
            rows={3}
          />
          <div className="formula-hint">
            支持基本数学运算符 (+, -, *, /, ^) 和函数 (sin, cos, max, min 等)
          </div>
        </div>

        <div className="form-group">
          <label>描述</label>
          <textarea
            value={formula.description}
            onChange={handleDescriptionChange}
            placeholder="描述这个公式的用途和影响..."
            rows={2}
          />
        </div>

        <div className="variables-section">
          <div className="section-header">
            <h3>变量</h3>
            <button className="btn-add" onClick={handleAddVariable}>添加变量</button>
          </div>

          {formula.variables.length === 0 ? (
            <div className="no-variables">还没有变量，点击"添加变量"按钮创建</div>
          ) : (
            <div className="variables-list">
              {formula.variables.map(variable => (
                <div key={variable.id} className="variable-item">
                  <div className="variable-header">
                    <input
                      type="text"
                      value={variable.name}
                      onChange={(e) => handleVariableNameChange(variable.id, e.target.value)}
                      placeholder="变量名"
                      className="variable-name"
                    />
                    <button
                      className="btn-remove"
                      onClick={() => onRemoveVariable(formula.id, variable.id)}
                    >
                      删除
                    </button>
                  </div>

                  <div className="variable-properties">
                    <div className="form-group">
                      <label>默认值</label>
                      <input
                        type="number"
                        value={variable.defaultValue}
                        onChange={(e) => handleVariableDefaultValueChange(variable.id, parseFloat(e.target.value))}
                      />
                    </div>

                    <div className="form-group">
                      <label>最小值</label>
                      <input
                        type="number"
                        value={variable.minValue || ''}
                        onChange={(e) => handleVariableMinValueChange(variable.id, parseFloat(e.target.value))}
                      />
                    </div>

                    <div className="form-group">
                      <label>最大值</label>
                      <input
                        type="number"
                        value={variable.maxValue || ''}
                        onChange={(e) => handleVariableMaxValueChange(variable.id, parseFloat(e.target.value))}
                      />
                    </div>

                    <div className="form-group">
                      <label>步长</label>
                      <input
                        type="number"
                        value={variable.step || ''}
                        onChange={(e) => handleVariableStepChange(variable.id, parseFloat(e.target.value))}
                        min="0.01"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>描述</label>
                    <input
                      type="text"
                      value={variable.description || ''}
                      onChange={(e) => handleVariableDescriptionChange(variable.id, e.target.value)}
                      placeholder="变量描述..."
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="test-section">
          <div className="section-header">
            <h3>测试公式</h3>
          </div>

          <div className="test-variables">
            {formula.variables.map(variable => (
              <div key={variable.id} className="form-group">
                <label>{variable.name}</label>
                <input
                  type="number"
                  value={testValues[variable.name] || 0}
                  onChange={(e) => handleTestValueChange(variable.name, parseFloat(e.target.value))}
                  min={variable.minValue}
                  max={variable.maxValue}
                  step={variable.step || 1}
                />
              </div>
            ))}
          </div>

          <div className="test-actions">
            <button className="btn-test" onClick={handleTestFormula}>计算结果</button>
          </div>

          {testResult !== null && (
            <div className="test-result">
              <strong>结果:</strong> {testResult}
            </div>
          )}

          {error && (
            <div className="test-error">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormulaEditor; 