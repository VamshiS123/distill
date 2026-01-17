import os
import random

import numpy as np
import torch


def seed_all(seed: int) -> None:
    """
    Seeds all random number generators to ensure reproducible results during
    experiments and prevent variations caused by random initialization and
    computational backends. This includes seeding the Python standard random
    module, NumPy, PyTorch, and setting environment variables for hash seed stability.

    :param seed: The integer value used to initialize all random number generators.
    :type seed: int
    :return: None
    """
    random.seed(seed)
    os.environ["PYTHONHASHSEED"] = str(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False
