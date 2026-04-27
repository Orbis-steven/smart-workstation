import { MODULA_MAX_ACTIVE_TRAYS } from './config';

export function buildModulaJobs(rows = [], type) {
  const traysToProcess = [...new Set(rows.map((row) => row.tray))].sort((left, right) => left.localeCompare(right));

  return traysToProcess.map((tray) => {
    const itemsInTray = rows.filter((row) => row.tray === tray);

    return {
      id: `JOB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tray,
      bin: tray,
      type,
      toNo: rows[0]?.toNo ?? '',
      status: 'pending',
      itemsCount: itemsInTray.length,
      itemIds: itemsInTray.map((row) => row.id),
      items: itemsInTray,
    };
  });
}

export function findQueueJobForRow(row, jobQueue = [], statuses = null) {
  const normalizedStatuses = statuses ? new Set(statuses) : null;

  return [...jobQueue]
    .reverse()
    .find((job) => {
      const statusMatched = normalizedStatuses ? normalizedStatuses.has(job.status) : true;
      return statusMatched
        && job.bin === row.bin
        && job.type === row.jobType
        && job.toNo === row.toNo
        && job.itemIds?.includes(row.id);
    }) ?? null;
}

export function isSapRowDisabled({ row, ordersByToNo = {}, jobQueue = [] }) {
  if (row.isLocationQuery || row.isInventoryQuery) {
    return true;
  }

  if (ordersByToNo[row.toNo]?.status === 'completed') {
    return true;
  }

  return jobQueue.some((job) => job.toNo === row.toNo && job.itemIds?.includes(row.id));
}

export function scheduleModulaQueue({ jobQueue = [], activeJobs = [], maxActiveJobs = MODULA_MAX_ACTIVE_TRAYS }) {
  let nextJobQueue = [...jobQueue];
  let nextActiveJobs = [...activeJobs];
  let changed = false;

  const activeJobIds = new Set(nextActiveJobs.map((job) => job.id));
  const pendingJobs = nextJobQueue.filter((job) => job.status === 'pending' && !activeJobIds.has(job.id));

  if (pendingJobs.length > 0 && nextActiveJobs.length < maxActiveJobs) {
    const spotsAvailable = maxActiveJobs - nextActiveJobs.length;
    const jobsToActivate = pendingJobs.slice(0, spotsAvailable).map((job, index) => ({
      ...job,
      status: (nextActiveJobs.some((activeJob) => activeJob.status === 'processing') || index > 0) ? 'waiting' : 'processing',
    }));

    nextActiveJobs = [...nextActiveJobs, ...jobsToActivate];
    nextJobQueue = nextJobQueue.map((job) => jobsToActivate.find((activeJob) => activeJob.id === job.id) ?? job);
    changed = jobsToActivate.length > 0;
  }

  if (nextActiveJobs.length > 0 && !nextActiveJobs.some((job) => job.status === 'processing')) {
    const waitingIndex = nextActiveJobs.findIndex((job) => job.status === 'waiting');
    if (waitingIndex >= 0) {
      const promotedJob = { ...nextActiveJobs[waitingIndex], status: 'processing' };
      nextActiveJobs = nextActiveJobs.map((job, index) => index === waitingIndex ? promotedJob : job);
      nextJobQueue = nextJobQueue.map((job) => job.id === promotedJob.id ? promotedJob : job);
      changed = true;
    }
  }

  return { changed, nextJobQueue, nextActiveJobs };
}

export function completeProcessingJob({ activeJobs = [], jobQueue = [] }) {
  const processingJob = activeJobs.find((job) => job.status === 'processing');
  if (!processingJob) {
    return {
      completedJob: null,
      nextActiveJobs: activeJobs,
      nextJobQueue: jobQueue,
      nextProcessingJob: null,
    };
  }

  const remainingActiveJobs = activeJobs.filter((job) => job.id !== processingJob.id);
  const waitingJob = remainingActiveJobs.find((job) => job.status === 'waiting');
  const nextProcessingId = waitingJob?.id ?? null;

  const nextActiveJobs = remainingActiveJobs.map((job) => (
    job.id === nextProcessingId ? { ...job, status: 'processing' } : job
  ));

  const nextJobQueue = jobQueue.map((job) => {
    if (job.id === processingJob.id) {
      return { ...job, status: 'completed' };
    }

    if (job.id === nextProcessingId) {
      return { ...job, status: 'processing' };
    }

    return job;
  });

  return {
    completedJob: processingJob,
    nextActiveJobs,
    nextJobQueue,
    nextProcessingJob: nextActiveJobs.find((job) => job.status === 'processing') ?? null,
  };
}

export function getQueueSummary({ jobQueue = [], activeJobs = [] }) {
  return {
    processing: activeJobs.filter((job) => job.status === 'processing').length,
    waiting: activeJobs.filter((job) => job.status === 'waiting').length,
    pending: jobQueue.filter((job) => job.status === 'pending').length,
    completed: jobQueue.filter((job) => job.status === 'completed').length,
  };
}
