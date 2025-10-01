
const env  = process.env.NODE_ENV;

const levels = ['debug', 'info', 'log', 'warn', 'error'];

const currentLevel = env === 'development' ? 'debug' : 'warn';

function shouldLog(level) {
    return true;
    return levels.indexOf(level) >= levels.indexOf(currentLevel);
}

const logger = {};

levels.forEach(level => {
    logger[level] = (...args) => {
        if (shouldLog(level)) {
            // 这里可以根据需求扩展，比如接入远程日志服务器、格式化日志等
            console[level](...args);
        }
    };
});
export default logger;
