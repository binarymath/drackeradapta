import React from 'react';
import { safeLocalStorageClear } from '../utils/storage';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', fontFamily: 'sans-serif', color: 'red' }}>
                    <h1>Algo deu errado.</h1>
                    <details style={{ whiteSpace: 'pre-wrap' }}>
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </details>
                    <button
                        onClick={() => { safeLocalStorageClear(); window.location.reload(); }}
                        style={{ marginTop: '20px', padding: '10px', background: 'red', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Limpar Dados e Recarregar
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
