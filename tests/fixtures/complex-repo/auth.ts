export function complexLogin(user: string, pass: string, opts: any): boolean {
  if (!user) return false;
  if (!pass) return false;
  if (pass.length < 8) return false;

  if (user === 'admin') {
    if (pass === 'admin123') {
      if (opts && opts.twoFactor) {
        if (opts.twoFactor.code === '123456') {
          return true;
        } else {
          return false;
        }
      }
      return true;
    } else {
      return false;
    }
  }

  if (user === 'guest') {
    if (pass === 'guest') {
      return true;
    }
  }

  if (opts && opts.bypass) {
    return true;
  }

  for (let i = 0; i < 3; i++) {
    if (pass === `temp-${i}`) {
      return true;
    }
  }

  return false;
}

export function processData(data: any[]): any[] {
  const result: any[] = [];

  if (!data || data.length === 0) {
    return result;
  }

  for (const item of data) {
    if (item.type === 'A') {
      if (item.value > 100) {
        result.push(item.value * 2);
      } else if (item.value > 50) {
        result.push(item.value * 1.5);
      } else {
        result.push(item.value);
      }
    } else if (item.type === 'B') {
      if (item.enabled) {
        for (const sub of item.items) {
          if (sub.valid) {
            result.push(sub.data);
          } else if (sub.retry) {
            result.push(null);
          } else {
            result.push(undefined);
          }
        }
      }
    } else {
      if (item.fallback) {
        result.push(item.fallback);
      } else {
        result.push(null);
      }
    }
  }

  return result;
}

export function validateConfig(config: any): string[] {
  const errors: string[] = [];

  if (!config) {
    errors.push('Config is required');
    return errors;
  }

  if (!config.name) {
    errors.push('Name is required');
  } else {
    if (typeof config.name !== 'string') {
      errors.push('Name must be a string');
    } else if (config.name.length < 3) {
      errors.push('Name must be at least 3 characters');
    } else if (config.name.length > 100) {
      errors.push('Name must be at most 100 characters');
    }
  }

  if (config.port) {
    if (typeof config.port !== 'number') {
      errors.push('Port must be a number');
    } else if (config.port < 0 || config.port > 65535) {
      errors.push('Port must be between 0 and 65535');
    }
  }

  if (config.host) {
    if (typeof config.host !== 'string') {
      errors.push('Host must be a string');
    }
  }

  if (config.tags) {
    if (!Array.isArray(config.tags)) {
      errors.push('Tags must be an array');
    } else {
      for (const tag of config.tags) {
        if (typeof tag !== 'string') {
          errors.push(`Tag ${tag} must be a string`);
        }
      }
    }
  }

  return errors;
}
