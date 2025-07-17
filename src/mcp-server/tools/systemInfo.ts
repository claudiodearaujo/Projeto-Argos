/**
 * 💻 Ferramenta System Info - Projeto Argos MCP
 * 
 * Obtém informações do sistema operacional e ambiente
 */

import { platform, arch, cpus, totalmem, freemem, uptime, version } from 'os';
import { logger } from '../utils/logger.js';

export class SystemInfoTool {
    public readonly definition = {
        name: 'system_info',
        description: 'Obtém informações sobre o sistema operacional, hardware e ambiente de execução.',
        inputSchema: {
            type: 'object',
            properties: {
                detailed: {
                    type: 'boolean',
                    default: false,
                    description: 'Se verdadeiro, retorna informações detalhadas'
                }
            },
            required: []
        }
    };

    async execute(args: { detailed?: boolean }): Promise<any> {
        const { detailed = false } = args;
        
        logger.info('💻 Coletando informações do sistema...');

        try {
            const systemInfo = {
                platform: platform(),
                architecture: arch(),
                nodeVersion: process.version,
                osVersion: version(),
                uptime: this.formatUptime(uptime()),
                memory: {
                    total: this.formatBytes(totalmem()),
                    free: this.formatBytes(freemem()),
                    used: this.formatBytes(totalmem() - freemem())
                }
            };

            let infoText = `🖥️ **Informações do Sistema**\n\n`;
            infoText += `**Sistema Operacional:** ${systemInfo.platform}\n`;
            infoText += `**Arquitetura:** ${systemInfo.architecture}\n`;
            infoText += `**Node.js:** ${systemInfo.nodeVersion}\n`;
            infoText += `**Uptime:** ${systemInfo.uptime}\n\n`;
            infoText += `**💾 Memória:**\n`;
            infoText += `• Total: ${systemInfo.memory.total}\n`;
            infoText += `• Livre: ${systemInfo.memory.free}\n`;
            infoText += `• Em uso: ${systemInfo.memory.used}\n`;

            if (detailed) {
                const cpuInfo = cpus();
                infoText += `\n**🔧 CPU:**\n`;
                infoText += `• Modelo: ${cpuInfo[0]?.model || 'Desconhecido'}\n`;
                infoText += `• Núcleos: ${cpuInfo.length}\n`;
                infoText += `• Velocidade: ${cpuInfo[0]?.speed || 0} MHz\n`;

                infoText += `\n**🌐 Ambiente:**\n`;
                infoText += `• PWD: ${process.cwd()}\n`;
                infoText += `• PID: ${process.pid}\n`;
                if (process.env.NODE_ENV) {
                    infoText += `• NODE_ENV: ${process.env.NODE_ENV}\n`;
                }
            }

            logger.info('✅ Informações do sistema coletadas');

            return {
                content: [
                    {
                        type: 'text',
                        text: infoText
                    }
                ]
            };

        } catch (error) {
            logger.error('❌ Erro ao coletar informações do sistema:', error);
            
            return {
                content: [
                    {
                        type: 'text',
                        text: `❌ **Erro ao obter informações do sistema**\n\nErro: ${error.message}`
                    }
                ]
            };
        }
    }

    private formatBytes(bytes: number): string {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Bytes';
        
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    private formatUptime(uptimeSeconds: number): string {
        const days = Math.floor(uptimeSeconds / 86400);
        const hours = Math.floor((uptimeSeconds % 86400) / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        
        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        
        return parts.join(' ') || '< 1m';
    }
} 